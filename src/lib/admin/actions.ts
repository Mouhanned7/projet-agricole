"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { normalizeSortOrder } from "@/lib/domain/ranking";
import { sendEmail } from "@/lib/email";
import { WORKFLOW_LABEL } from "@/lib/lands/labels";
import { recomputeRanking } from "@/lib/lands/ranking-sync";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export interface AdminResult {
  ok: boolean;
  error?: string;
}

const uuid = z.string().uuid();
const STATUSES = [
  "submitted",
  "info_requested",
  "title_review",
  "agri_analysis",
  "economic_review",
  "validation",
  "published",
  "matching",
  "negotiation",
  "closed",
  "suspended",
  "rejected",
] as const;

async function requireAdmin() {
  const session = await getSession();
  if (!session?.profile?.roles.includes("admin")) return null;
  return { session, supabase: await createClient() };
}

async function audit(action: string, entity: string, entityId: string, details: Record<string, unknown> = {}) {
  const ctx = await requireAdmin();
  if (!ctx) return;
  await ctx.supabase.from("audit_log").insert({ actor_id: ctx.session.userId, action, entity, entity_id: entityId, details });
}

/** Adresse e-mail du porteur, lue avec la clé serveur (auth.users n'est pas exposé). */
async function ownerEmail(ownerId: string): Promise<string | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const { data } = await createServiceClient().auth.admin.getUserById(ownerId);
  return data.user?.email ?? null;
}

function refresh(landId: string) {
  revalidatePath("/admin");
  revalidatePath(`/admin/terrains/${landId}`);
  revalidatePath("/catalogue");
  revalidatePath(`/terrains/${landId}`);
  revalidatePath("/");
}

/** §9, §10, scénario 12 : changement de statut journalisé, porteur notifié. */
export async function setLandStatus(landId: string, status: string, note?: string): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { ok: false, error: "Réservé à l'administration." };
  const parsed = z.object({ landId: uuid, status: z.enum(STATUSES), note: z.string().trim().max(1000).optional() }).safeParse({ landId, status, note });
  if (!parsed.success) return { ok: false, error: "Statut invalide." };

  const { data: land } = await ctx.supabase.from("lands").select("owner_id, title, ref, ranking_status").eq("id", landId).maybeSingle();
  if (!land) return { ok: false, error: "Terrain introuvable." };
  if (status === "published" && land.ranking_status === "incomplete")
    return { ok: false, error: "Ce dossier est « À compléter » (titre ou eau manquant) : il ne peut pas être publié." };

  const { error } = await ctx.supabase.rpc("admin_set_status", { p_land: landId, p_status: status, p_note: parsed.data.note || null });
  if (error) return { ok: false, error: "Changement de statut impossible." };

  if (status === "published") await recomputeRanking(ctx.supabase, landId);
  const email = await ownerEmail(land.owner_id);
  if (email) {
    await sendEmail({
      to: email,
      subject: `${land.title ?? land.ref} : ${WORKFLOW_LABEL[status as keyof typeof WORKFLOW_LABEL]}`,
      text: `Bonjour,\n\nLe statut de votre terrain « ${land.title ?? land.ref} » est maintenant : ${WORKFLOW_LABEL[status as keyof typeof WORKFLOW_LABEL]}.${parsed.data.note ? `\n\nMessage de l'équipe VerdOlive :\n${parsed.data.note}` : ""}`,
      link: `/espace-porteur/terrains/${landId}`,
    });
  }
  refresh(landId);
  return { ok: true };
}

/** CLA-05 : « Titre vérifié » après contrôle réel, avec date, auteur et réserves. */
export async function verifyTitle(landId: string, verified: boolean, notes?: string): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx || !uuid.safeParse(landId).success) return { ok: false, error: "Réservé à l'administration." };
  const { data: title } = await ctx.supabase.from("land_titles").select("answer").eq("land_id", landId).maybeSingle();
  if (verified && title?.answer !== "yes") return { ok: false, error: "Seul un terrain déclaré avec titre foncier peut être vérifié." };

  const now = new Date().toISOString();
  const r1 = await ctx.supabase
    .from("land_titles")
    .update({ verified_by: verified ? ctx.session.userId : null, verified_at: verified ? now : null, verification_notes: notes?.trim() || null })
    .eq("land_id", landId);
  // La preuve est remise à « déclaré » puis recalculée (document fourni ou non).
  const r2 = await ctx.supabase.from("lands").update({ title_proof: verified ? "verified" : "declared" }).eq("id", landId);
  if (r1.error || r2.error) return { ok: false, error: "Enregistrement impossible." };
  await recomputeRanking(ctx.supabase, landId);
  await audit(verified ? "verify_title" : "unverify_title", "land", landId, { notes });
  refresh(landId);
  return { ok: true };
}

/** §9 : eau « déclarée » → « documentée » ou « analysée » après réception des pièces. */
export async function setWaterProof(landId: string, proof: "declared" | "documented" | "analyzed"): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx || !uuid.safeParse(landId).success) return { ok: false, error: "Réservé à l'administration." };
  const { data: water } = await ctx.supabase.from("land_water").select("answer").eq("land_id", landId).maybeSingle();
  if (proof !== "declared" && water?.answer !== "yes") return { ok: false, error: "Ce terrain est déclaré sans eau." };
  const now = new Date().toISOString();
  await ctx.supabase.from("land_water").update({ verified_by: proof === "declared" ? null : ctx.session.userId, verified_at: proof === "declared" ? null : now }).eq("land_id", landId);
  const { error } = await ctx.supabase.from("lands").update({ water_proof: proof }).eq("id", landId);
  if (error) return { ok: false, error: "Enregistrement impossible." };
  await recomputeRanking(ctx.supabase, landId);
  await audit("set_water_proof", "land", landId, { proof });
  refresh(landId);
  return { ok: true };
}

/** §4 : statut de chaque pièce, avec la personne qui a vérifié. */
export async function reviewDocument(documentId: string, status: "accepted" | "refused" | "to_review", notes?: string): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx || !uuid.safeParse(documentId).success) return { ok: false, error: "Réservé à l'administration." };
  const { data, error } = await ctx.supabase
    .from("land_documents")
    .update({ status, reviewed_by: ctx.session.userId, reviewed_at: new Date().toISOString(), review_notes: notes?.trim() || null })
    .eq("id", documentId)
    .select("land_id")
    .single();
  if (error || !data) return { ok: false, error: "Mise à jour impossible." };
  await recomputeRanking(ctx.supabase, data.land_id);
  await audit("review_document", "document", documentId, { status, notes });
  refresh(data.land_id);
  return { ok: true };
}

export async function resolveAlert(alertId: number): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { ok: false, error: "Réservé à l'administration." };
  await ctx.supabase.from("admin_alerts").update({ resolved_at: new Date().toISOString() }).eq("id", alertId);
  revalidatePath("/admin");
  return { ok: true };
}

/** RES-09 : réponse tracée à un signalement. */
export async function handleReport(reportId: string, status: "in_progress" | "resolved" | "rejected", response: string): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx || !uuid.safeParse(reportId).success) return { ok: false, error: "Réservé à l'administration." };
  const { data: report, error } = await ctx.supabase
    .from("reports")
    .update({
      status,
      admin_response: response.trim() || null,
      handled_by: ctx.session.userId,
      resolved_at: status === "in_progress" ? null : new Date().toISOString(),
    })
    .eq("id", reportId)
    .select("reporter_email")
    .single();
  if (error) return { ok: false, error: "Mise à jour impossible." };
  if (report?.reporter_email && response.trim() && status !== "in_progress") {
    await sendEmail({
      to: report.reporter_email,
      subject: "Votre signalement VerdOlive",
      text: `Bonjour,\n\nVotre signalement S-${reportId.slice(0, 8).toUpperCase()} a été traité.\n\nRéponse de l'équipe VerdOlive :\n${response.trim()}`,
    });
  }
  await audit("handle_report", "report", reportId, { status });
  revalidatePath("/admin/signalements");
  return { ok: true };
}

/** D4 et CLA-04 : réglages modifiables sans intervention du développeur. */
export async function saveSettings(input: { showLowByDefault: boolean; sortOrder: string[] }): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { ok: false, error: "Réservé à l'administration." };
  const rows = [
    { key: "catalog.show_low_by_default", value: Boolean(input.showLowByDefault), updated_by: ctx.session.userId },
    { key: "ranking.sort_order", value: normalizeSortOrder(input.sortOrder), updated_by: ctx.session.userId },
  ];
  const { error } = await ctx.supabase.from("settings").upsert(rows);
  if (error) return { ok: false, error: "Enregistrement impossible." };
  await audit("save_settings", "settings", "catalog", { ...input });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Commission ou frais affichés sur la fiche (RES-06). */
export async function setFeeNote(landId: string, note: string): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx || !uuid.safeParse(landId).success) return { ok: false, error: "Réservé à l'administration." };
  const { error } = await ctx.supabase.from("land_offers").update({ verdolive_fee_note: note.trim().slice(0, 500) || null }).eq("land_id", landId);
  if (error) return { ok: false, error: "Enregistrement impossible." };
  refresh(landId);
  return { ok: true };
}
