import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { computeRanking, normalizeWeights } from "@/lib/domain/ranking";
import type { TitleProof, WaterProof } from "@/lib/domain/types";
import { createServiceClient } from "@/lib/supabase/server";
import { draftSchema, toRankingInput, type LandDraftInput } from "./draft";
import { getDraft, getMedia } from "./queries";

/**
 * CLA-01 : recalcule le classement et l'enregistre. L'appelant doit avoir vérifié
 * l'accès au terrain (lecture RLS) ; l'écriture passe par la clé serveur car les
 * colonnes de classement sont protégées. Les preuves posées par l'administration
 * (titre vérifié, eau documentée ou analysée) sont reprises dans le calcul.
 */
export async function recomputeRanking(supabase: SupabaseClient, landId: string, draftInput?: LandDraftInput) {
  const [media, { data: current }] = await Promise.all([
    getMedia(supabase, landId),
    supabase.from("lands").select("title_proof, water_proof").eq("id", landId).maybeSingle(),
  ]);
  const draft = draftInput ? draftSchema.parse(draftInput) : ((await getDraft(landId))?.draft ?? null);
  if (!draft) return null;

  const input = toRankingInput(draft, media);
  if (current?.title_proof === "verified") input.title.proof = "verified" as TitleProof;
  if (current?.water_proof === "documented" || current?.water_proof === "analyzed") input.water.proof = current.water_proof as WaterProof;
  const { data: setting } = await supabase.from("settings").select("value").eq("key", "ranking.weights").maybeSingle();
  const ranking = computeRanking(input, normalizeWeights(setting?.value));

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    await createServiceClient()
      .from("lands")
      .update({
        ranking_status: ranking.status,
        ranking_reason: ranking.reason,
        title_proof: ranking.titleProof,
        water_proof: ranking.waterProof,
        has_flow: draft.water.answer === "yes" && draft.water.flowValue != null,
        score_legal: ranking.scores.legal,
        score_water: ranking.scores.water,
        score_completeness: ranking.scores.completeness,
      })
      .eq("id", landId);
  }
  return { ranking, media };
}
