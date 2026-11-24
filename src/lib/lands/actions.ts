"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import type { RankingResult } from "@/lib/domain/types";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { draftSchema, toRows, type DraftMedia, type LandDraftInput } from "./draft";
import { recomputeRanking } from "./ranking-sync";

export interface SaveResult {
  ok: boolean;
  landId?: string;
  ref?: string;
  ranking?: RankingResult;
  media?: DraftMedia;
  error?: string;
  blockingIssues?: string[];
}

const EDITABLE = ["draft", "info_requested"];

async function requireOwner() {
  if (!supabaseConfigured) return { error: "Enregistrement indisponible : le service n'est pas configuré." } as const;
  const session = await getSession();
  if (!session?.profile) return { error: "Votre session a expiré. Reconnectez-vous pour enregistrer." } as const;
  return { session } as const;
}

/** Garde la trace des réponses changées (§3.2 C : rien n'est supprimé immédiatement). */
function withHistory(prev: Record<string, unknown> | null, next: Record<string, unknown>) {
  if (!prev || prev.answer == null || prev.answer === next.answer) return next;
  const { history, ...snapshot } = prev;
  delete snapshot.updated_at;
  const entry = { at: new Date().toISOString(), from: prev.answer, to: next.answer, snapshot };
  return { ...next, history: [...((history as unknown[]) ?? []), entry].slice(-20) };
}

/** TER-05 : enregistrement automatique du brouillon à chaque étape. */
export async function saveDraft(input: { landId?: string | null; step: number; draft: LandDraftInput }): Promise<SaveResult> {
  const auth = await requireOwner();
  if ("error" in auth) return { ok: false, error: auth.error };
  const { session } = auth;

  const parsed = draftSchema.safeParse(input.draft);
  if (!parsed.success) return { ok: false, error: "Certaines valeurs sont invalides. Vérifiez les champs signalés." };
  const rows = toRows(parsed.data);
  const step = Math.min(7, Math.max(1, Math.round(input.step)));
  const supabase = await createClient();

  // Le compte devient porteur s'il ne l'était pas encore (INS-09).
  if (!session.profile!.roles.includes("owner")) {
    await supabase.from("profiles").update({ roles: [...session.profile!.roles, "owner"] }).eq("id", session.userId);
  }

  let landId = input.landId ?? null;
  let ref: string | undefined;
  if (landId) {
    const { data: existing } = await supabase.from("lands").select("status, ref").eq("id", landId).maybeSingle();
    if (!existing) return { ok: false, error: "Ce terrain est introuvable." };
    if (!EDITABLE.includes(existing.status))
      return { ok: false, error: "Ce dossier a été soumis : contactez l'équipe VerdOlive pour le modifier." };
    ref = existing.ref;
    const { error } = await supabase.from("lands").update({ ...rows.land, wizard_step: step }).eq("id", landId);
    if (error) return { ok: false, error: "Enregistrement impossible. Réessayez." };
  } else {
    const { data, error } = await supabase
      .from("lands")
      .insert({ ...rows.land, owner_id: session.userId, wizard_step: step })
      .select("id, ref")
      .single();
    if (error || !data) return { ok: false, error: "Création du brouillon impossible. Réessayez." };
    landId = data.id as string;
    ref = data.ref;
  }

  const [{ data: prevTitle }, { data: prevWater }] = await Promise.all([
    supabase.from("land_titles").select("*").eq("land_id", landId).maybeSingle(),
    supabase.from("land_water").select("*").eq("land_id", landId).maybeSingle(),
  ]);
  const results = await Promise.all([
    supabase.from("land_titles").upsert({ land_id: landId, ...withHistory(prevTitle, rows.title) }),
    supabase.from("land_water").upsert({ land_id: landId, ...withHistory(prevWater, rows.water) }),
    supabase.from("land_offers").upsert({ land_id: landId, ...rows.offer }),
  ]);
  if (results.some((r) => r.error)) return { ok: false, landId, ref, error: "Une partie du dossier n'a pas pu être enregistrée." };

  const computed = await recomputeRanking(supabase, landId, parsed.data);
  revalidatePath("/espace-porteur");
  return { ok: true, landId, ref, ranking: computed?.ranking, media: computed?.media };
}

/** Après l'ajout ou la suppression d'une photo / d'un document (étape 5). */
export async function refreshRanking(landId: string): Promise<SaveResult> {
  const auth = await requireOwner();
  if ("error" in auth) return { ok: false, error: auth.error };
  const supabase = await createClient();
  const { data } = await supabase.from("lands").select("id").eq("id", landId).maybeSingle();
  if (!data) return { ok: false, error: "Ce terrain est introuvable." };
  const computed = await recomputeRanking(supabase, landId);
  return { ok: true, landId, ranking: computed?.ranking, media: computed?.media };
}

/** Étape 7 : soumission. Bloquée sans titre et eau renseignés (TER-01, règle 4) ou sans e-mail confirmé (D7). */
export async function submitLand(landId: string): Promise<SaveResult> {
  const auth = await requireOwner();
  if ("error" in auth) return { ok: false, error: auth.error };
  const supabase = await createClient();
  const { data: land } = await supabase.from("lands").select("status").eq("id", landId).maybeSingle();
  if (!land) return { ok: false, error: "Ce terrain est introuvable." };
  if (!EDITABLE.includes(land.status)) return { ok: false, error: "Ce dossier a déjà été soumis." };

  const computed = await recomputeRanking(supabase, landId);
  if (!computed) return { ok: false, error: "Ce terrain est introuvable." };
  if (!computed.ranking.canSubmit)
    return { ok: false, ranking: computed.ranking, blockingIssues: computed.ranking.blockingIssues, error: "Le dossier est incomplet." };
  if (!auth.session.profile?.email_verified_at)
    return {
      ok: false,
      ranking: computed.ranking,
      error: "Confirmez d'abord votre adresse e-mail : utilisez le lien reçu, ou « Renvoyer le lien » en haut de la page.",
    };

  const { error } = await supabase
    .from("lands")
    .update({ status: "submitted", submitted_at: new Date().toISOString(), wizard_step: 7 })
    .eq("id", landId);
  if (error) return { ok: false, error: "Soumission impossible. Réessayez." };
  revalidatePath("/espace-porteur");
  return { ok: true, landId, ranking: computed.ranking };
}

export async function deleteDraft(landId: string): Promise<SaveResult> {
  const auth = await requireOwner();
  if ("error" in auth) return { ok: false, error: auth.error };
  const supabase = await createClient();
  const { error, count } = await supabase.from("lands").delete({ count: "exact" }).eq("id", landId).eq("status", "draft");
  if (error || !count) return { ok: false, error: "Seuls les brouillons peuvent être supprimés." };
  revalidatePath("/espace-porteur");
  return { ok: true };
}
