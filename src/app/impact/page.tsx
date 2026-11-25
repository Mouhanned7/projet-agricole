import type { Metadata } from "next";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Notre impact" };

/** RES-10 / RES-12 : indicateurs déclarés des projets concrétisés. Imprimable en PDF. */
export default async function ImpactPage() {
  const row = supabaseConfigured ? (await (await createClient()).rpc("impact_summary")).data?.[0] : null;
  const items: [string, number][] = [
    ["Projets concrétisés", row?.projects ?? 0], ["Hectares remis en valeur", row?.hectares ?? 0], ["Arbres plantés", row?.trees ?? 0],
    ["Emplois créés", row?.jobs ?? 0], ["Femmes bénéficiaires", row?.women ?? 0], ["Jeunes bénéficiaires", row?.youth ?? 0],
  ];
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Rapport d&apos;impact {new Date().getFullYear()}</h1>
      <p className="mt-2 text-ink-600">Personnes, Profit, Planète.</p>
      <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {items.map(([label, v]) => (
          <div key={label} className="rounded-card bg-white p-5 ring-1 ring-forest-900/10">
            <dt className="text-sm text-ink-600">{label}</dt>
            <dd className="mt-1 text-3xl font-semibold text-forest-900">{Number(v).toLocaleString("fr-FR")}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-sm text-ink-400">Données déclarées à la signature des projets, non auditées. Pour un PDF : imprimer la page (Cmd+P).</p>
    </div>
  );
}
