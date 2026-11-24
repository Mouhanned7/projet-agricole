import "server-only";
import { cache } from "react";
import { DEFAULT_SORT_ORDER, normalizeSortOrder, type SortCriterion } from "@/lib/domain/ranking";
import { createClient, createServiceClient, supabaseConfigured } from "@/lib/supabase/server";
import { demoItems, rowToItem } from "./map";
import type { CatalogItem } from "./types";

/** URLs signées (1 h) pour les photos d'un bucket privé. */
async function signPhotos(paths: string[][]): Promise<string[][]> {
  const flat = paths.flat();
  if (!flat.length || !process.env.SUPABASE_SERVICE_ROLE_KEY) return paths.map(() => []);
  const { data } = await createServiceClient().storage.from("land-photos").createSignedUrls(flat, 3600);
  const byPath = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
  return paths.map((ps) => ps.map((p) => byPath.get(p)).filter((u): u is string => Boolean(u)));
}

/** Terrains publiés. Sans Supabase : données de démonstration. */
export const getCatalogItems = cache(async (): Promise<{ items: CatalogItem[]; demo: boolean }> => {
  if (!supabaseConfigured) return { items: demoItems(), demo: true };
  const supabase = await createClient();
  const { data, error } = await supabase.from("catalog_lands").select("*").limit(2000);
  if (error) {
    console.error("catalog_lands", error.message);
    return { items: [], demo: false };
  }
  const rows = data ?? [];
  const photos = await signPhotos(rows.map((r) => ((r.photo_paths as string[]) ?? []).slice(0, 1)));
  return { items: rows.map((r, i) => rowToItem(r, photos[i])), demo: false };
});

export const getCatalogItem = cache(async (id: string): Promise<CatalogItem | null> => {
  if (!supabaseConfigured) return demoItems().find((l) => l.id === id) ?? null;
  const supabase = await createClient();
  const { data } = await supabase.from("catalog_lands").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  const [photos] = await signPhotos([((data.photo_paths as string[]) ?? []).slice(0, 12)]);
  return rowToItem(data, photos);
});

export interface CatalogSettings {
  showLowByDefault: boolean;
  sortOrder: SortCriterion[];
}

/** Réglages de l'administration (D4, CLA-04). */
export const getCatalogSettings = cache(async (): Promise<CatalogSettings> => {
  const fallback = { showLowByDefault: false, sortOrder: DEFAULT_SORT_ORDER };
  if (!supabaseConfigured) return fallback;
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("key, value").in("key", ["catalog.show_low_by_default", "ranking.sort_order"]);
  const map = new Map((data ?? []).map((r) => [r.key, r.value]));
  return {
    showLowByDefault: map.get("catalog.show_low_by_default") === true,
    sortOrder: normalizeSortOrder(map.get("ranking.sort_order")),
  };
});
