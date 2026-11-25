import type { Metadata } from "next";
import { requestQuote } from "@/lib/extras/actions";
import { GOVERNORATES } from "@/lib/data/tunisia";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Prestataires agricoles" };

export default async function ProvidersPage({ searchParams }: { searchParams: Promise<{ envoye?: string }> }) {
  const data = supabaseConfigured ? (await (await createClient()).from("providers").select("*").eq("active", true).order("service")).data : [];
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Prestataires agricoles</h1>
      <p className="mt-2 text-ink-600">Préparation du sol, irrigation, plantation, clôture, photovoltaïque… Demandez un devis.</p>
      {(await searchParams).envoye && <p className="mt-4 rounded-xl bg-olive-100 p-3 text-sm">Demande envoyée à l&apos;équipe VerdOlive.</p>}
      {!data?.length && <p className="mt-6 text-ink-600">Les prestataires arrivent bientôt.</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {data?.map((p) => (
          <article key={p.id} className="rounded-card bg-white p-5 ring-1 ring-forest-900/10">
            <h2 className="font-semibold">{p.name}</h2>
            <p className="text-sm text-ink-600">{p.service} · {GOVERNORATES.find((g) => g.id === p.governorate_id)?.fr ?? "Toute la Tunisie"}</p>
            <form action={requestQuote} className="mt-3 space-y-2">
              <input type="hidden" name="provider" value={p.id} />
              <textarea name="message" required rows={2} maxLength={2000} placeholder="Votre besoin, la surface, les dates" className="w-full rounded-xl border border-forest-900/15 px-3 py-2 text-sm" />
              <button className="rounded-full bg-forest-900 px-5 py-2 text-sm font-medium text-cream-50">Demander un devis</button>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}
