"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { filtersToSearch, parseFilters } from "@/lib/catalog/filters";
import { createClient } from "@/lib/supabase/server";

/** INV-06 : enregistrer la recherche en cours. */
export async function saveSearch(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/catalogue");
  const f = parseFilters(Object.fromEntries(new URLSearchParams(String(formData.get("query") ?? ""))));
  const query = filtersToSearch(f);
  const label = String(formData.get("label") || "Ma recherche").slice(0, 200);
  const supabase = await createClient();
  await supabase.from("saved_searches").upsert({ user_id: session.userId, query, label }, { onConflict: "user_id,query" });
  redirect("/compte/recherches");
}

export async function deleteSearch(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("saved_searches").delete().eq("id", String(formData.get("id")));
  revalidatePath("/compte/recherches");
}
