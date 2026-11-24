import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LandCard } from "@/components/land-card";
import { getSession } from "@/lib/auth/session";
import { getCatalogItems } from "@/lib/catalog/source";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mes favoris" };

export default async function FavoritesPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/favoris");
  const supabase = await createClient();
  const [{ data }, { items }] = await Promise.all([
    supabase.from("favorites").select("land_id").eq("user_id", session.userId),
    getCatalogItems(),
  ]);
  const ids = new Set((data ?? []).map((f) => f.land_id));
  const lands = items.filter((l) => ids.has(l.id));
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Mes favoris</h1>
      {lands.length === 0 ? (
        <p className="mt-4 text-ink-600">
          Aucun terrain enregistré. <Link href="/catalogue" className="font-semibold text-forest-800 underline underline-offset-2">Parcourir le catalogue</Link>
        </p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {lands.map((l, i) => <LandCard key={l.id} land={l} index={i} />)}
        </div>
      )}
    </div>
  );
}
