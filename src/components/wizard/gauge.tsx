"use client";

import { ArrowUpRight, CheckCircle2, CircleDashed, Search, Star } from "lucide-react";
import { TitlePill, WaterPill } from "@/components/ui/proof-pills";
import type { RankingResult } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

const LEVELS = [
  { status: "incomplete", label: "À compléter", icon: CircleDashed, cls: "text-danger-600", bar: "bg-danger-600" },
  { status: "needs_check", label: "Vérification nécessaire", icon: Search, cls: "text-warning-600", bar: "bg-gold-500" },
  { status: "priority", label: "Prioritaire", icon: Star, cls: "text-forest-800", bar: "bg-olive-600" },
] as const;

/**
 * Jauge de dossier (§3.1, TER-06) : niveau en direct et actions qui l'améliorent.
 * « Non prioritaire » (ni titre ni eau) est affiché sur la même échelle que « À compléter ».
 */
export function DossierGauge({ ranking, compact = false }: { ranking: RankingResult; compact?: boolean }) {
  const level = ranking.status === "low" ? 0 : LEVELS.findIndex((l) => l.status === ranking.status);
  const current = LEVELS[Math.max(0, level)];
  const label = ranking.status === "low" ? "Non prioritaire" : current.label;
  const Icon = current.icon;

  return (
    <div className="rounded-card bg-white p-5 ring-1 ring-forest-900/10" aria-live="polite">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Niveau de votre dossier</p>
      <p className={cn("mt-2 flex items-center gap-2 text-lg font-semibold", ranking.status === "low" ? "text-ink-600" : current.cls)}>
        <Icon className="size-5" aria-hidden /> {label}
      </p>

      <div className="mt-3 grid grid-cols-3 gap-1" aria-hidden>
        {LEVELS.map((l, i) => (
          <span key={l.status} className={cn("h-2 rounded-full", i <= level ? current.bar : "bg-cream-200")} />
        ))}
      </div>

      {!compact && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          <TitlePill proof={ranking.titleProof} />
          <WaterPill proof={ranking.waterProof} />
        </div>
      )}

      <p className="mt-3 text-sm text-ink-600">
        Dossier complété à <strong className="text-ink-900">{ranking.scores.completeness} %</strong>
      </p>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream-200" aria-hidden>
        <span className="block h-full rounded-full bg-forest-800 transition-[width] duration-500" style={{ width: `${ranking.scores.completeness}%` }} />
      </div>

      {ranking.actions.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm font-semibold text-ink-900">Pour améliorer votre dossier</p>
          <ul className="mt-2 space-y-1.5">
            {ranking.actions.slice(0, compact ? 2 : 4).map((a) => (
              <li key={a} className="flex items-start gap-2 text-sm text-ink-600">
                <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-gold-600" aria-hidden />
                {a}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-5 flex items-center gap-2 text-sm font-medium text-forest-800">
          <CheckCircle2 className="size-4" aria-hidden /> Votre dossier est complet.
        </p>
      )}
    </div>
  );
}
