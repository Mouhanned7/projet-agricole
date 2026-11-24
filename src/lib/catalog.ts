import { DEMO_LANDS } from "@/lib/data/demo-lands";
import { compareRecommended } from "@/lib/domain/ranking";

export type CatalogLand = (typeof DEMO_LANDS)[number];

/**
 * Terrains publiés, triés « Recommandés » (§5.2).
 * Sprint 4 : lecture de la vue catalog_lands dans Supabase + filtres.
 */
export function getCatalog(): { visible: CatalogLand[]; hiddenLow: number; all: CatalogLand[] } {
  const key = (l: CatalogLand) => ({
    ...l.ranking,
    agriScore: l.agriScore ?? null,
    hasFlow: Boolean(l.water.flow),
    completeness: l.ranking.scores.completeness,
    publishedAt: l.publishedAt,
  });
  const all = [...DEMO_LANDS].sort((a, b) => compareRecommended(key(a), key(b)));
  const visible = all.filter((l) => l.ranking.status !== "low"); // décision D4
  return { visible, hiddenLow: all.length - visible.length, all };
}
