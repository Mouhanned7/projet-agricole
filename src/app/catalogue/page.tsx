import { Map as MapIcon, SearchX, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar } from "@/components/catalog/filter-bar";
import { LandCard } from "@/components/land-card";
import { buttonVariants } from "@/components/ui/button";
import { applyFilters, filtersToSearch, parseFilters, withoutFilter } from "@/lib/catalog/filters";
import { getCatalogItems, getCatalogSettings } from "@/lib/catalog/source";
import { saveSearch } from "@/lib/investor/searches";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Terrains disponibles" };

const PAGE = 24;

/** Catalogue (§6.1 à 6.3). Consultable sans compte (D2), trié « Recommandés » par défaut (INV-01). */
export default async function CatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const [{ items: all, demo }, settings] = await Promise.all([getCatalogItems(), getCatalogSettings()]);
  const result = applyFilters(all, filters, settings);
  const shown = Math.min(result.total, Math.max(PAGE, Number(params.n) || PAGE));
  const href = (f: typeof filters, extra = "") => {
    const q = filtersToSearch(f);
    return `/catalogue${q || extra ? "?" : ""}${q}${q && extra ? "&" : ""}${extra}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl font-semibold text-forest-900">Terrains disponibles</h1>
          <p className="mt-1 text-ink-600" aria-live="polite">
            <strong className="text-ink-900">{result.total}</strong> terrain{result.total > 1 ? "s" : ""}
            {result.hiddenLow > 0 && (
              <>
                {" "}·{" "}
                <Link href={href({ ...filters, tous: true })} className="underline underline-offset-2">
                  {result.hiddenLow} sans titre ni eau masqué{result.hiddenLow > 1 ? "s" : ""}
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
        <Link href="/projet" className={buttonVariants({ variant: "outline", size: "sm" })}>Mon projet</Link>
        <Link href="/comparer" className={buttonVariants({ variant: "outline", size: "sm" })}>Comparer</Link>
        <Link href={`/carte${filtersToSearch(filters) ? `?${filtersToSearch(filters)}` : ""}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          <MapIcon className="size-4" aria-hidden /> Voir sur la carte
        </Link>
        </div>
      </div>

      <div className="mt-6">
        <FilterBar filters={filters} total={result.total} />
      </div>

      {result.active.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Filtres actifs">
          {result.active.map((a) => (
            <Link
              key={a.key + a.label}
              href={href(withoutFilter(filters, a.key))}
              className="inline-flex items-center gap-1.5 rounded-full bg-forest-900 py-1 pl-3 pr-2 text-xs font-medium text-cream-50 hover:bg-forest-800"
              aria-label={`Retirer le filtre ${a.label}`}
            >
              {a.label} <X className="size-3.5" aria-hidden />
            </Link>
          ))}
          <Link href="/catalogue" className="text-sm font-medium text-forest-800 underline underline-offset-2">
            Tout réinitialiser
          </Link>
          <form action={saveSearch}>
            <input type="hidden" name="query" value={filtersToSearch(filters)} />
            <input type="hidden" name="label" value={result.active.map((a) => a.label).join(", ")} />
            <button className="text-sm font-medium text-forest-800 underline underline-offset-2">Enregistrer cette recherche</button>
          </form>
        </div>
      )}

      {result.total === 0 ? (
        <div className="mt-10 rounded-card bg-white p-10 text-center ring-1 ring-forest-900/10">
          <SearchX className="mx-auto size-10 text-ink-400" aria-hidden />
          <p className="mt-4 text-lg font-semibold text-ink-900">Aucun terrain ne correspond à ces critères.</p>
          {result.suggestion ? (
            <p className="mt-2 text-ink-600">
              <Link href={href(withoutFilter(filters, result.suggestion.key))} className="font-semibold text-forest-800 underline underline-offset-2">
                {result.suggestion.count} terrain{result.suggestion.count > 1 ? "s" : ""} si vous retirez le filtre « {result.suggestion.label} »
              </Link>
            </p>
          ) : (
            <p className="mt-2 text-ink-600">De nouveaux terrains sont publiés régulièrement.</p>
          )}
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.slice(0, shown).map((land, i) => (
              <LandCard key={land.id} land={land} index={i} />
            ))}
          </div>
          {shown < result.total && (
            <div className="mt-8 text-center">
              <Link href={href(filters, `n=${shown + PAGE}`)} scroll={false} className={cn(buttonVariants({ variant: "outline" }))}>
                Afficher plus de terrains
              </Link>
            </div>
          )}
        </>
      )}
      {demo && <p className="mt-6 text-center text-xs text-ink-400">Données de démonstration, fictives.</p>}
    </div>
  );
}
