import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CancelVisitButton } from "@/components/account/visit-buttons";
import { getSession } from "@/lib/auth/session";
import { VISIT_STATUS } from "@/lib/lands/visit-labels";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mes demandes de visite" };

export default async function MyVisitsPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/visites");
  const supabase = await createClient();
  const { data } = await supabase
    .from("visit_requests")
    .select("id, land_id, status, message, preferred_dates, created_at")
    .eq("investor_id", session.userId)
    .order("created_at", { ascending: false });
  const ids = (data ?? []).map((v) => v.land_id);
  const { data: lands } = ids.length ? await supabase.from("catalog_lands").select("id, title, ref").in("id", ids) : { data: [] };
  const name = new Map((lands ?? []).map((l) => [l.id, l.title ?? l.ref]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Mes demandes de visite</h1>
      {!data?.length ? (
        <p className="mt-4 text-ink-600">Aucune demande pour le moment.</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {data.map((v) => (
            <li key={v.id} className="rounded-card bg-white p-5 ring-1 ring-forest-900/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/terrains/${v.land_id}`} className="font-semibold text-ink-900 underline-offset-2 hover:underline">
                  {name.get(v.land_id) ?? "Terrain retiré du catalogue"}
                </Link>
                <span className="rounded-full bg-cream-200 px-2.5 py-0.5 text-xs font-medium text-ink-600">{VISIT_STATUS[v.status]}</span>
              </div>
              <p className="mt-1 text-xs text-ink-400">Envoyée le {new Date(v.created_at).toLocaleDateString("fr-FR")}</p>
              {v.message && <p className="mt-2 text-sm text-ink-600">{v.message}</p>}
              {["new", "seen", "scheduled"].includes(v.status) && <div className="mt-3"><CancelVisitButton id={v.id} /></div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
