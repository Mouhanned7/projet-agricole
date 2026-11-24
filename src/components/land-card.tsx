import { ArrowRight, MapPin, Maximize2 } from "lucide-react";
import Link from "next/link";
import { LandVisual } from "@/components/land-visual";
import { StatusBadge, TitlePill, WaterPill } from "@/components/ui/proof-pills";
import type { CatalogItem } from "@/lib/catalog/types";
import { OBJECTIVE_LABEL } from "@/lib/lands/labels";
import { formatHa, formatTnd } from "@/lib/utils";

export function priceLine(land: CatalogItem): { label: string; value: string } {
  if (land.objective === "sale" && land.priceTnd != null) return { label: "Prix demandé", value: formatTnd(land.priceTnd) };
  if (land.objective === "rent" && land.rentTnd != null)
    return { label: land.rentPeriod === "mensuel" ? "Loyer mensuel" : "Loyer annuel", value: formatTnd(land.rentTnd) };
  if (land.objective === "partnership")
    return {
      label: land.partnershipType === "mgharsa" ? "Mgharsa" : "Partenariat",
      value: land.ownerSharePct != null ? `${land.ownerSharePct} % propriétaire` : "À discuter",
    };
  return { label: "Prix", value: "Sur demande" };
}

/** Carte synthétique du catalogue (§6.1). */
export function LandCard({ land, index = 0 }: { land: CatalogItem; index?: number }) {
  const price = priceLine(land);
  const cover = land.photoUrls[0];
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card bg-white shadow-[0_1px_2px_rgba(20,35,19,0.06),0_8px_24px_-12px_rgba(20,35,19,0.18)] ring-1 ring-forest-900/5 transition-shadow hover:shadow-[0_2px_4px_rgba(20,35,19,0.08),0_16px_32px_-12px_rgba(20,35,19,0.28)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-cream-200">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <LandVisual hue={land.hue} seed={index + 1} className="transition-transform duration-500 group-hover:scale-105" />
        )}
        <div className="absolute inset-x-3 top-3">
          <StatusBadge status={land.rankingStatus} />
        </div>
        <span className="absolute bottom-3 left-3 rounded-full bg-forest-950/75 px-2.5 py-1 text-xs font-medium text-cream-50">
          {OBJECTIVE_LABEL[land.objective]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-semibold text-ink-900">
            <Link href={`/terrains/${land.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
              {land.name}
            </Link>
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-ink-600">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              {[land.delegation, land.governorate].filter(Boolean).join(", ") || "Tunisie"}
            </span>
            {land.areaHa != null && (
              <span className="inline-flex items-center gap-1">
                <Maximize2 className="size-3.5" aria-hidden />
                {formatHa(land.areaHa)}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <TitlePill proof={land.titleProof} answer={land.titleAnswer} />
          <WaterPill proof={land.waterProof} />
        </div>

        {(land.crops || land.trees.length > 0) && (
          <p className="line-clamp-1 text-sm text-ink-600">{land.trees.length ? land.trees.map((t) => t.species).join(", ") : land.crops}</p>
        )}
        <p className="text-xs text-ink-400">{land.rankingReason}</p>

        <div className="mt-auto flex items-end justify-between border-t border-cream-200 pt-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink-400">{price.label}</p>
            <p className="font-semibold text-forest-900">{price.value}</p>
          </div>
          <span className="grid size-9 place-items-center rounded-full bg-gold-500 text-forest-950 transition-colors group-hover:bg-gold-400">
            <ArrowRight className="size-4" aria-hidden />
          </span>
        </div>
      </div>
    </article>
  );
}
