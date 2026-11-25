import "server-only";
import { applyFilters, parseFilters } from "@/lib/catalog/filters";
import { rowToItem } from "@/lib/catalog/map";
import { createServiceClient } from "@/lib/supabase/server";

/** Prévient les investisseurs dont une recherche enregistrée correspond au terrain publié. */
export async function notifySavedSearches(landId: string) {
  const db = createServiceClient();
  const [{ data: row }, { data: searches }] = await Promise.all([
    db.from("catalog_lands").select("*").eq("id", landId).maybeSingle(),
    db.from("saved_searches").select("user_id, query, label").limit(5000),
  ]);
  if (!row || !searches?.length) return;
  const item = rowToItem(row);
  const users = new Map<string, string>();
  for (const s of searches)
    if (applyFilters([item], parseFilters(Object.fromEntries(new URLSearchParams(s.query)))).total === 1) users.set(s.user_id, s.label);
  if (users.size)
    await db.from("notifications").insert([...users].map(([user_id, label]) => ({ user_id, kind: "new_land", title: `Nouveau terrain : ${item.name}`, body: `Correspond à votre recherche « ${label} ».`, link: `/terrains/${landId}` })));
}
