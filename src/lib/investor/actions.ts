"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { createClient, createServiceClient, supabaseConfigured } from "@/lib/supabase/server";

export interface InvestorResult {
  ok: boolean;
  error?: string;
  /** Action attendue de l'utilisateur avant de continuer. */
  need?: "login" | "charter" | "verify";
  favorite?: boolean;
  ticket?: string;
}

const uuid = z.string().uuid();
const NOT_READY: InvestorResult = { ok: false, error: "Service indisponible : la base de données n'est pas configurée." };

/** Favoris (§8). */
export async function toggleFavorite(landId: string): Promise<InvestorResult> {
  if (!supabaseConfigured) return NOT_READY;
  if (!uuid.safeParse(landId).success) return { ok: false, error: "Terrain inconnu." };
  const session = await getSession();
  if (!session) return { ok: false, need: "login" };
  const supabase = await createClient();
  const { data } = await supabase.from("favorites").select("land_id").eq("land_id", landId).eq("user_id", session.userId).maybeSingle();
  const { error } = data
    ? await supabase.from("favorites").delete().eq("land_id", landId).eq("user_id", session.userId)
    : await supabase.from("favorites").insert({ land_id: landId, user_id: session.userId });
  if (error) return { ok: false, error: "Action impossible. Réessayez." };
  revalidatePath("/compte/favoris");
  return { ok: true, favorite: !data };
}

/** RES-01 : acceptation de la charte de l'investissement responsable. */
export async function acceptCharter(): Promise<InvestorResult> {
  if (!supabaseConfigured) return NOT_READY;
  const session = await getSession();
  if (!session) return { ok: false, need: "login" };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ charter_accepted_at: new Date().toISOString() }).eq("id", session.userId);
  if (error) return { ok: false, error: "Enregistrement impossible. Réessayez." };
  return { ok: true };
}

const visitSchema = z.object({
  landId: uuid,
  message: z.string().trim().max(1000).optional().default(""),
  dates: z.string().trim().max(200).optional().default(""),
});

/** Scénarios 14 et 19 : demande de visite, après la charte et l'e-mail confirmé. */
export async function requestVisit(input: z.input<typeof visitSchema>): Promise<InvestorResult> {
  if (!supabaseConfigured) return NOT_READY;
  const parsed = visitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Message trop long (1 000 caractères maximum)." };
  const session = await getSession();
  if (!session?.profile) return { ok: false, need: "login" };
  if (!session.profile.charter_accepted_at) return { ok: false, need: "charter" };
  if (!session.profile.email_verified_at) return { ok: false, need: "verify" };

  const supabase = await createClient();
  if (!session.profile.roles.includes("investor")) {
    await supabase.from("profiles").update({ roles: [...session.profile.roles, "investor"] }).eq("id", session.userId);
  }
  const { data: existing } = await supabase
    .from("visit_requests")
    .select("id")
    .eq("land_id", parsed.data.landId)
    .eq("investor_id", session.userId)
    .in("status", ["new", "seen", "scheduled"])
    .maybeSingle();
  if (existing) return { ok: false, error: "Vous avez déjà une demande en cours pour ce terrain." };

  const { error } = await supabase.from("visit_requests").insert({
    land_id: parsed.data.landId,
    investor_id: session.userId,
    message: parsed.data.message || null,
    preferred_dates: parsed.data.dates || null,
  });
  if (error) return { ok: false, error: "Demande impossible. Réessayez." };
  revalidatePath("/compte/visites");
  return { ok: true };
}

const reportSchema = z.object({
  landId: uuid.nullable(),
  category: z.enum(["wrong_info", "land_conflict", "water_conflict", "abuse", "other"]),
  message: z.string().trim().min(10, "Décrivez le problème en quelques mots (10 caractères minimum).").max(2000),
  email: z.string().trim().email("Adresse e-mail invalide.").optional().or(z.literal("")),
});

/** RES-09 / scénario 22 : signalement avec accusé de réception (numéro de ticket). */
export async function reportProblem(input: z.input<typeof reportSchema>): Promise<InvestorResult> {
  if (!supabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NOT_READY;
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Signalement invalide." };
  const session = await getSession();
  if (!session && !parsed.data.email) return { ok: false, error: "Indiquez votre adresse e-mail pour recevoir la réponse." };

  // Écriture serveur : un visiteur sans compte peut signaler, et reçoit son numéro de ticket.
  const { data, error } = await createServiceClient()
    .from("reports")
    .insert({
      land_id: parsed.data.landId,
      reporter_id: session?.userId ?? null,
      reporter_email: session?.email ?? parsed.data.email ?? null,
      category: parsed.data.category,
      message: parsed.data.message,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Signalement impossible. Réessayez." };
  return { ok: true, ticket: `S-${String(data.id).slice(0, 8).toUpperCase()}` };
}

export async function cancelVisit(visitId: string): Promise<InvestorResult> {
  if (!supabaseConfigured) return NOT_READY;
  if (!uuid.safeParse(visitId).success) return { ok: false };
  const session = await getSession();
  if (!session) return { ok: false, need: "login" };
  const supabase = await createClient();
  await supabase.from("visit_requests").update({ status: "cancelled" }).eq("id", visitId).eq("investor_id", session.userId);
  revalidatePath("/compte/visites");
  return { ok: true };
}

/** Le porteur fait avancer une demande de visite reçue. */
export async function updateVisitStatus(visitId: string, status: "seen" | "scheduled" | "done" | "cancelled"): Promise<InvestorResult> {
  if (!supabaseConfigured) return NOT_READY;
  if (!uuid.safeParse(visitId).success) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("visit_requests").update({ status }).eq("id", visitId);
  if (error) return { ok: false, error: "Mise à jour impossible." };
  revalidatePath("/espace-porteur/visites");
  return { ok: true };
}
