import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { RankingStatus, TitleProof, WaterProof, LandWorkflowStatus } from "@/lib/domain/types";
import { fromRows, type DraftMedia, type LandDraft } from "./draft";

export interface MyLand {
  id: string;
  ref: string;
  title: string | null;
  objective: string | null;
  status: LandWorkflowStatus;
  wizard_step: number;
  ranking_status: RankingStatus;
  ranking_reason: string;
  title_proof: TitleProof;
  water_proof: WaterProof;
  score_completeness: number;
  area_ha: number | null;
  governorate_id: string | null;
  updated_at: string;
}

export async function getMyLands(userId: string): Promise<MyLand[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lands")
    .select(
      "id, ref, title, objective, status, wizard_step, ranking_status, ranking_reason, title_proof, water_proof, score_completeness, area_ha, governorate_id, updated_at",
    )
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false });
  return (data ?? []) as MyLand[];
}

/** Compteurs de photos et pièces (étape 5), lus avec les droits de l'utilisateur. */
export async function getMedia(supabase: SupabaseClient, landId: string): Promise<DraftMedia> {
  const [{ count: photoCount }, { data: docs }] = await Promise.all([
    supabase.from("land_photos").select("id", { count: "exact", head: true }).eq("land_id", landId),
    supabase.from("land_documents").select("kind, status").eq("land_id", landId).neq("status", "refused"),
  ]);
  const kinds = (docs ?? []).map((d) => d.kind as string);
  return {
    photoCount: photoCount ?? 0,
    documentsCount: kinds.length,
    hasTitleUpload: kinds.includes("title") || kinds.includes("alt_ownership"),
    hasWaterAnalysis: kinds.includes("water_analysis"),
  };
}

export interface LoadedDraft {
  id: string;
  ref: string;
  status: LandWorkflowStatus;
  step: number;
  draft: LandDraft;
  media: DraftMedia;
}

/** Reprise d'un brouillon depuis n'importe quel appareil (TER-05). RLS : propriétaire ou admin. */
export async function getDraft(landId: string): Promise<LoadedDraft | null> {
  const supabase = await createClient();
  const { data: land } = await supabase.from("lands").select("*").eq("id", landId).maybeSingle();
  if (!land) return null;
  const [{ data: title }, { data: water }, { data: offer }, media] = await Promise.all([
    supabase.from("land_titles").select("*").eq("land_id", landId).maybeSingle(),
    supabase.from("land_water").select("*").eq("land_id", landId).maybeSingle(),
    supabase.from("land_offers").select("*").eq("land_id", landId).maybeSingle(),
    getMedia(supabase, landId),
  ]);
  return {
    id: land.id,
    ref: land.ref,
    status: land.status,
    step: land.wizard_step,
    draft: fromRows(land, title, water, offer),
    media,
  };
}
