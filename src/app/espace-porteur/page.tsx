import { ArrowRight, MapPin, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusBadge, TitlePill, WaterPill } from "@/components/ui/proof-pills";
import { buttonVariants } from "@/components/ui/button";
import { GOVERNORATES } from "@/lib/data/tunisia";
import { EDITABLE_STATUSES, OBJECTIVE_LABEL, WORKFLOW_LABEL } from "@/lib/lands/labels";
import { getSession } from "@/lib/auth/session";
import { getMyLands } from "@/lib/lands/queries";
import { cn, formatHa } from "@/lib/utils";

export const metadata: Metadata = { title: "Mon espace porteur" };

/** INS-08 : destination du porteur de terrain. */
export default async function OwnerSpacePage() {
  const session = await getSession();
  if (!session?.profile) redirect("/connexion?next=/espace-porteur");
  const lands = await getMyLands(session.userId);
  const firstName = session.profile.full_name.split(" ")[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl font-semibold text-forest-900">Bonjour {firstName}</h1>
          <p className="mt-2 text-ink-600">Présentez votre terrain pour le vendre, le louer ou trouver un partenaire.</p>
        </div>
        {lands.length > 0 && (
          <Link href="/espace-porteur/terrains/nouveau" className={buttonVariants({ variant: "gold" })}>
            <Plus className="size-4" aria-hidden /> Ajouter un terrain
          </Link>
        )}
      </div>

      {lands.length === 0 ? (
        <Link
          href="/espace-porteur/terrains/nouveau"
          className="group mt-8 block rounded-card border-2 border-dashed border-forest-900/15 bg-white p-8 text-center hover:border-gold-500"
        >
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-olive-100 text-forest-800 group-hover:bg-gold-100">
            <Plus className="size-7" aria-hidden />
          </span>
          <span className="mt-4 block text-xl font-semibold text-ink-900">Ajouter mon terrain</span>
          <span className="mx-auto mt-2 block max-w-md text-sm text-ink-600">
            7 étapes guidées, enregistrées automatiquement. Les deux questions essentielles : le titre foncier et l&apos;eau.
          </span>
          <span className={cn(buttonVariants({ variant: "forest" }), "mt-6")}>
            Commencer <ArrowRight className="size-4" aria-hidden />
          </span>
        </Link>
      ) : (
        <ul className="mt-8 space-y-3">
          {lands.map((l) => {
            const editable = EDITABLE_STATUSES.includes(l.status);
            const gov = GOVERNORATES.find((g) => g.id === l.governorate_id);
            return (
              <li key={l.id}>
                <Link
                  href={`/espace-porteur/terrains/${l.id}`}
                  className="flex flex-col gap-4 rounded-card bg-white p-5 ring-1 ring-forest-900/10 transition hover:ring-gold-500 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-ink-400">{l.ref}</span>
                      <span className="rounded-full bg-cream-200 px-2.5 py-0.5 text-xs font-medium text-ink-600">{WORKFLOW_LABEL[l.status]}</span>
                      <StatusBadge status={l.ranking_status} className="bg-cream-100" />
                    </div>
                    <p className="mt-1.5 truncate text-lg font-semibold text-ink-900">{l.title ?? "Terrain sans nom"}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-ink-600">
                      {l.objective && <span>{OBJECTIVE_LABEL[l.objective as keyof typeof OBJECTIVE_LABEL]}</span>}
                      {gov && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" aria-hidden /> {gov.fr}
                        </span>
                      )}
                      {l.area_ha && <span>{formatHa(Number(l.area_ha))}</span>}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <TitlePill proof={l.title_proof} />
                      <WaterPill proof={l.water_proof} />
                    </div>
                  </div>
                  <div className="sm:w-48">
                    <p className="text-xs text-ink-400">Complété à {l.score_completeness} %</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream-200" aria-hidden>
                      <span className="block h-full rounded-full bg-forest-800" style={{ width: `${l.score_completeness}%` }} />
                    </div>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-forest-800">
                      {editable ? `Reprendre à l'étape ${l.wizard_step}` : "Voir le dossier"} <ArrowRight className="size-4" aria-hidden />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
