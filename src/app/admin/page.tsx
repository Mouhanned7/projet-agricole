import { AlertTriangle, Flag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminLandRow } from "@/components/admin/land-row";
import { ResolveAlertButton } from "@/components/admin/small-actions";
import { getAdminLands, QUEUE_STATUSES } from "@/lib/admin/queries";
import { STATUS_LABEL } from "@/lib/domain/ranking";
import { createClient } from "@/lib/supabase/server";
import { requireAdminPage } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Administration" };

const ALERT_LABEL: Record<string, string> = {
  duplicate_title: "Numéro de titre déjà utilisé",
  inconsistent: "Informations incohérentes",
  stale_draft: "Dossier incomplet depuis longtemps",
  report: "Nouveau signalement",
};

/** Tableau de bord (§9) : file de vérification, alertes et statistiques. */
export default async function AdminHome() {
  await requireAdminPage();
  const supabase = await createClient();
  const [queue, all, { data: alerts }, { count: openReports }, { count: drafts }, { count: visits }] = await Promise.all([
    getAdminLands(QUEUE_STATUSES),
    getAdminLands(),
    supabase.from("admin_alerts").select("id, kind, land_id, payload, created_at").is("resolved_at", null).order("created_at", { ascending: false }).limit(20),
    supabase.from("reports").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
    supabase.from("lands").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("visit_requests").select("id", { count: "exact", head: true }),
  ]);
  const published = all.filter((l) => ["published", "matching", "negotiation"].includes(l.status));
  const byRank = (["priority", "needs_check", "low", "incomplete"] as const).map((r) => [r, published.filter((l) => l.ranking_status === r).length] as const);

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Tableau de bord</h1>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ["Brouillons", drafts ?? 0],
          ["À traiter", queue.length],
          ["Publiés", published.length],
          ["Demandes de visite", visits ?? 0],
          ["Signalements ouverts", openReports ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-card bg-white p-4 ring-1 ring-forest-900/10">
            <dt className="text-xs uppercase tracking-wide text-ink-400">{label}</dt>
            <dd className="mt-1 text-3xl font-semibold text-forest-900">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-ink-600">
        Terrains publiés par statut de classement : {byRank.map(([r, n]) => `${STATUS_LABEL[r]} ${n}`).join(" · ")}
      </p>

      {!!alerts?.length && (
        <section aria-labelledby="alertes">
          <h2 id="alertes" className="flex items-center gap-2 text-lg font-semibold text-ink-900">
            <AlertTriangle className="size-5 text-warning-600" aria-hidden /> Alertes ({alerts.length})
          </h2>
          <ul className="mt-3 divide-y divide-forest-900/10 rounded-card bg-white ring-1 ring-forest-900/10">
            {alerts.map((a) => (
              <li key={a.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <p className="font-medium text-ink-900">{ALERT_LABEL[a.kind] ?? a.kind}</p>
                  <p className="text-sm text-ink-600">
                    {a.kind === "duplicate_title" && (
                      <>
                        Numéro « {String((a.payload as Record<string, unknown>).number)} » ·{" "}
                        <Link className="underline" href={`/admin/terrains/${a.land_id}`}>ce terrain</Link> et{" "}
                        <Link className="underline" href={`/admin/terrains/${(a.payload as Record<string, unknown>).other_land_id}`}>l&apos;autre terrain</Link>
                      </>
                    )}
                    {a.kind === "report" && (
                      <Link className="underline" href="/admin/signalements">Voir les signalements</Link>
                    )}
                    {!["duplicate_title", "report"].includes(a.kind) && a.land_id && <Link className="underline" href={`/admin/terrains/${a.land_id}`}>Voir le terrain</Link>}
                  </p>
                  <p className="text-xs text-ink-400">{new Date(a.created_at).toLocaleString("fr-FR")}</p>
                </div>
                <ResolveAlertButton id={a.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="file">
        <h2 id="file" className="text-lg font-semibold text-ink-900">File de vérification</h2>
        <p className="text-sm text-ink-600">Dossiers avec titre et eau d&apos;abord, puis par date de soumission.</p>
        {queue.length === 0 ? (
          <p className="mt-3 rounded-card bg-white p-6 text-ink-600 ring-1 ring-forest-900/10">Aucun dossier en attente.</p>
        ) : (
          <ul className="mt-3 divide-y divide-forest-900/10 overflow-hidden rounded-card bg-white ring-1 ring-forest-900/10">
            {queue.map((l) => <AdminLandRow key={l.id} l={l} />)}
          </ul>
        )}
      </section>

      <p className="flex items-center gap-2 text-sm text-ink-600">
        <Flag className="size-4" aria-hidden /> <Link href="/admin/signalements" className="underline">{openReports ?? 0} signalement(s) à traiter</Link>
      </p>
    </div>
  );
}
