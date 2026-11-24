import { Droplets, FileCheck2, FileQuestion, FileText, ShieldCheck } from "lucide-react";
import { STATUS_LABEL } from "@/lib/domain/ranking";
import type { RankingStatus, TitleAnswer, TitleProof, WaterAnswer, WaterProof } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

/**
 * Pastilles Titre et Eau (§6.1, INV-04). Règle 6 : « déclaré » n'est jamais
 * affiché comme « vérifié ».
 */
const TITLE_LABEL: Record<TitleProof, string> = {
  verified: "Titre vérifié",
  document: "Titre déclaré · document fourni",
  declared: "Titre déclaré",
  none: "Sans titre foncier",
};

const WATER_LABEL: Record<WaterProof, string> = {
  analyzed: "Eau analysée",
  documented: "Eau documentée",
  declared: "Eau déclarée",
  none: "Sans eau",
};

const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap";

export function TitlePill({ proof, answer }: { proof: TitleProof; answer?: TitleAnswer | null }) {
  const label = proof === "none" && answer === "unknown" ? "Titre non confirmé" : TITLE_LABEL[proof];
  const Icon = proof === "verified" ? ShieldCheck : proof === "none" ? FileQuestion : proof === "document" ? FileCheck2 : FileText;
  return (
    <span
      className={cn(
        base,
        proof === "verified" && "bg-forest-800 text-cream-50",
        (proof === "document" || proof === "declared") && "bg-olive-100 text-forest-800",
        proof === "none" && "bg-cream-200 text-ink-600",
      )}
      title={proof === "verified" ? "Contrôlé par l'administration VerdOlive" : "Information déclarée par le propriétaire, non vérifiée"}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}

export function WaterPill({ proof }: { proof: WaterProof; answer?: WaterAnswer | null }) {
  return (
    <span
      className={cn(
        base,
        proof === "analyzed" && "bg-sky-800 text-white",
        proof === "documented" && "bg-sky-100 text-sky-900",
        proof === "declared" && "bg-sky-50 text-sky-900 ring-1 ring-sky-200",
        proof === "none" && "bg-cream-200 text-ink-600",
      )}
      title={proof === "analyzed" || proof === "documented" ? "Pièces reçues et contrôlées" : "Information déclarée par le propriétaire"}
    >
      <Droplets className="size-3.5" aria-hidden />
      {WATER_LABEL[proof]}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: RankingStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        status === "priority" && "bg-gold-500 text-forest-950",
        status === "needs_check" && "bg-cream-50/90 text-warning-600",
        status === "low" && "bg-cream-50/90 text-ink-600",
        status === "incomplete" && "bg-cream-50/90 text-danger-600",
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
