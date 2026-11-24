import "server-only";
import { createClient } from "@/lib/supabase/server";

export const QUEUE_STATUSES = ["submitted", "info_requested", "title_review", "agri_analysis", "economic_review", "validation"] as const;
const RANK = { priority: 0, needs_check: 1, low: 2, incomplete: 3 } as Record<string, number>;

export interface AdminLand {
  id: string;
  ref: string;
  title: string | null;
  objective: string | null;
  status: string;
  ranking_status: string;
  ranking_reason: string;
  title_proof: string;
  water_proof: string;
  score_completeness: number;
  governorate_id: string | null;
  area_ha: number | null;
  submitted_at: string | null;
  updated_at: string;
  owner_id: string;
}

export async function getAdminLands(statuses?: readonly string[]): Promise<AdminLand[]> {
  const supabase = await createClient();
  let q = supabase
    .from("lands")
    .select("id, ref, title, objective, status, ranking_status, ranking_reason, title_proof, water_proof, score_completeness, governorate_id, area_ha, submitted_at, updated_at, owner_id")
    .neq("status", "draft");
  if (statuses?.length) q = q.in("status", statuses as string[]);
  const { data } = await q.limit(1000);
  // §9 : file triée par priorité (titre et eau d'abord), puis ancienneté de la soumission.
  return ((data ?? []) as AdminLand[]).sort(
    (a, b) => RANK[a.ranking_status] - RANK[b.ranking_status] || (a.submitted_at ?? "").localeCompare(b.submitted_at ?? ""),
  );
}
