import { ArrowRight, Heart, MapPin, Maximize2 } from "lucide-react";
import { LandVisual } from "@/components/land-visual";
import { StatusBadge, TitlePill, WaterPill } from "@/components/ui/proof-pills";
import type { DemoLand } from "@/lib/data/demo-lands";
import type { RankingResult } from "@/lib/domain/types";
import { formatHa, formatTnd } from "@/lib/utils";

const OBJECTIVE_LABEL = { sale: "Vente", rent: "Location", partnership: "Partenariat" } as const;

function priceLine(land: DemoLand): { label: string; value: string } {
  if (land.objective === "sale" && land.priceTnd) return { label: "Prix demandé", value: formatTnd(land.priceTnd) };
  if (land.objective === "rent" && land.rentTnd) return { label: "Loyer annuel", value: formatTnd(land.rentTnd) };
  if (land.objective === "partnership")
    return { label: "Mgharsa", value: land.ownerSharePct ? `${land.ownerSharePct} % propriétaire` : "À discuter" };
  return { label: "Prix", value: "Sur demande" };
}

/** Carte synthétique du catalogue (§6.1). */
export function LandCard({ land, index = 0 }: { land: DemoLand & { ranking: RankingResult }; index?: number }) {
  const price = priceLine(land);
  return (
    <article className="group flex flex-col overflow-hidden rounded-card bg-white shadow-[0_1px_2px_rgba(20,35,19,0.06),0_8px_24px_-12px_rgba(20,35,19,0.18)] ring-1 ring-forest-900/5 transition-shadow hover:shadow-[0_2px_4px_rgba(20,35,19,0.08),0_16px_32px_-12px_rgba(20,35,19,0.28)]">
      <div className="relative aspect-[16/10] overflow-hidden">
        <LandVisual hue={land.hue} seed={index + 1} className="transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <StatusBadge status={land.ranking.status} />
          <button
            type="button"
            aria-label="Ajouter aux favoris"
            className="grid size-8 place-items-center rounded-full bg-cream-50/90 text-forest-900 hover:bg-white"
          >
            <Heart className="size-4" />
          </button>
        </div>
        <span className="absolute bottom-3 left-3 rounded-full bg-forest-950/75 px-2.5 py-1 text-xs font-medium text-cream-50">
          {OBJECTIVE_LABEL[land.objective]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-semibold text-ink-900">{land.name}</h3>
          <p className="mt-1 flex items-center gap-3 text-sm text-ink-600">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              {land.delegation}, {land.governorate}
            </span>
            <span className="inline-flex items-center gap-1">
              <Maximize2 className="size-3.5" aria-hidden />
              {formatHa(land.areaHa)}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <TitlePill proof={land.ranking.titleProof} answer={land.title.answer} />
          <WaterPill proof={land.ranking.waterProof} />
        </div>

        <p className="text-xs text-ink-400">{land.ranking.reason}</p>

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
