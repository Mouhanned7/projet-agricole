import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { deleteSearch } from "@/lib/investor/searches";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mes recherches" };

export default async function SearchesPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/recherches");
  const { data } = await (await createClient()).from("saved_searches").select("*").eq("user_id", session.userId).order("created_at", { ascending: false });
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Mes recherches</h1>
      <p className="mt-2 text-sm text-ink-600">Vous êtes prévenu quand un nouveau terrain correspond.</p>
      {!data?.length ? (
        <p className="mt-6 text-ink-600">Aucune recherche enregistrée. <Link href="/catalogue" className="underline">Parcourir le catalogue</Link></p>
      ) : (
        <ul className="mt-6 space-y-3">
          {data.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 rounded-card bg-white p-4 ring-1 ring-forest-900/10">
              <Link href={`/catalogue?${s.query}`} className="font-medium text-forest-800 underline">{s.label}</Link>
              <form action={deleteSearch}><input type="hidden" name="id" value={s.id} /><button className="text-sm text-danger-600 underline">Supprimer</button></form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
