import type { Metadata } from "next";
import Link from "next/link";
import { ReportForm } from "@/components/admin/small-actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Signalements · Administration" };

const CAT: Record<string, string> = {
  wrong_info: "Information erronée",
  land_conflict: "Conflit foncier",
  water_conflict: "Conflit sur l'eau",
  abuse: "Comportement abusif",
  other: "Autre",
};
const STATUS: Record<string, string> = { open: "Ouvert", in_progress: "En cours", resolved: "Résolu", rejected: "Rejeté" };

/** RES-09 : file de suivi des signalements, réponse tracée. Délai cible : 72 h ouvrées (D11). */
export default async function ReportsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(200);
  return (
    <div>
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Signalements</h1>
      <p className="mt-2 text-sm text-ink-600">Délai de réponse cible : 72 heures ouvrées.</p>
      {!data?.length ? (
        <p className="mt-6 text-ink-600">Aucun signalement.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {data.map((r) => {
            const late = r.status === "open" && Date.now() - new Date(r.created_at).getTime() > 3 * 24 * 3600 * 1000;
            return (
              <li key={r.id} className="rounded-card bg-white p-5 ring-1 ring-forest-900/10">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono text-ink-400">S-{String(r.id).slice(0, 8).toUpperCase()}</span>
                  <span className="rounded-full bg-cream-200 px-2 py-0.5 font-medium text-ink-600">{STATUS[r.status]}</span>
                  <span className="rounded-full bg-gold-100 px-2 py-0.5 font-medium text-forest-900">{CAT[r.category]}</span>
                  {late && <span className="rounded-full bg-danger-600/10 px-2 py-0.5 font-medium text-danger-600">Délai dépassé</span>}
                </div>
                <p className="mt-2 whitespace-pre-line text-ink-900">{r.message}</p>
                <p className="mt-1 text-xs text-ink-400">
                  {new Date(r.created_at).toLocaleString("fr-FR")} · {r.reporter_email ?? "utilisateur connecté"}
                  {r.land_id && (
                    <> · <Link className="underline" href={`/admin/terrains/${r.land_id}`}>terrain concerné</Link></>
                  )}
                </p>
                <ReportForm id={r.id} status={r.status} response={r.admin_response} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
