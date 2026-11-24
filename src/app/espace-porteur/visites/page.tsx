import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VisitStatusButtons } from "@/components/account/visit-buttons";
import { getSession } from "@/lib/auth/session";
import { VISIT_STATUS } from "@/lib/lands/visit-labels";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Demandes de visite reçues" };

/** Scénario 14 : la demande est visible par le propriétaire. */
export default async function ReceivedVisitsPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/espace-porteur/visites");
  const supabase = await createClient();
  const { data: lands } = await supabase.from("lands").select("id, title, ref").eq("owner_id", session.userId);
  const landIds = (lands ?? []).map((l) => l.id);
  const { data: visits } = landIds.length
    ? await supabase.from("visit_requests").select("id, land_id, investor_id, status, message, preferred_dates, created_at").in("land_id", landIds).order("created_at", { ascending: false })
    : { data: [] };
  const investorIds = [...new Set((visits ?? []).map((v) => v.investor_id))];
  const { data: people } = investorIds.length ? await supabase.from("profiles").select("id, full_name, phone, country").in("id", investorIds) : { data: [] };
  const landName = new Map((lands ?? []).map((l) => [l.id, l.title ?? l.ref]));
  const person = new Map((people ?? []).map((p) => [p.id, p]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Demandes de visite reçues</h1>
      {!visits?.length ? (
        <p className="mt-4 text-ink-600">Aucune demande pour le moment. Vous serez prévenu dès qu&apos;un investisseur souhaite visiter votre terrain.</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {visits.map((v) => {
            const p = person.get(v.investor_id);
            return (
              <li key={v.id} className="rounded-card bg-white p-5 ring-1 ring-forest-900/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-ink-900">{landName.get(v.land_id)}</p>
                  <span className="rounded-full bg-cream-200 px-2.5 py-0.5 text-xs font-medium text-ink-600">{VISIT_STATUS[v.status]}</span>
                </div>
                <p className="mt-1 text-sm text-ink-600">
                  {p?.full_name ?? "Investisseur"}
                  {p?.country && ` · ${p.country}`}
                  {p?.phone && ` · ${p.phone}`}
                </p>
                <p className="text-xs text-ink-400">Reçue le {new Date(v.created_at).toLocaleDateString("fr-FR")}</p>
                {v.message && <p className="mt-2 text-sm text-ink-900">« {v.message} »</p>}
                {v.preferred_dates && <p className="mt-1 text-sm text-ink-600">Disponibilités : {v.preferred_dates}</p>}
                <div className="mt-3"><VisitStatusButtons id={v.id} status={v.status} /></div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
