import { List } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar } from "@/components/catalog/filter-bar";
import { LandsMap, type MapPoint } from "@/components/catalog/lands-map";
import { priceLine } from "@/components/land-card";
import { buttonVariants } from "@/components/ui/button";
import { applyFilters, filtersToSearch, parseFilters } from "@/lib/catalog/filters";
import { getCatalogItems, getCatalogSettings } from "@/lib/catalog/source";
import { formatHa } from "@/lib/utils";

export const metadata: Metadata = { title: "Carte des terrains" };

/** Carte interactive (§8) : mêmes filtres que le catalogue. */
export default async function MapPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = parseFilters(await searchParams);
  const [{ items }, settings] = await Promise.all([getCatalogItems(), getCatalogSettings()]);
  const result = applyFilters(items, filters, settings);
  const points: MapPoint[] = result.items
    .filter((l) => l.latApprox != null && l.lngApprox != null)
    .map((l) => ({
      id: l.id,
      name: l.name,
      lat: l.latApprox!,
      lng: l.lngApprox!,
      status: l.rankingStatus,
      price: priceLine(l).value,
      place: [l.delegation, l.governorate].filter(Boolean).join(", "),
      area: l.areaHa != null ? formatHa(l.areaHa) : "",
    }));
  const q = filtersToSearch(filters);

  return (
    <div className="mx-auto flex max-w-7xl flex-col px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl font-semibold text-forest-900">Carte des terrains</h1>
          <p className="mt-1 text-sm text-ink-600">
            {points.length} terrain{points.length > 1 ? "s" : ""} · positions approximatives
            {result.total > points.length && ` · ${result.total - points.length} sans position`}
          </p>
        </div>
        <Link href={`/catalogue${q ? `?${q}` : ""}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          <List className="size-4" aria-hidden /> Voir la liste
        </Link>
      </div>
      <div className="mt-5">
        <FilterBar filters={filters} total={result.total} />
      </div>
      <div className="mt-5 h-[65vh] min-h-[420px] overflow-hidden rounded-card ring-1 ring-forest-900/10">
        <LandsMap points={points} />
      </div>
      <p className="mt-3 flex flex-wrap gap-4 text-xs text-ink-600">
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-gold-600" /> Prioritaire</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-olive-600" /> Vérification nécessaire</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-ink-400" /> Non prioritaire</span>
      </p>
    </div>
  );
}
