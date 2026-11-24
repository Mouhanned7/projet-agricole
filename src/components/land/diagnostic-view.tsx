import { AlertTriangle, CheckCircle2, Droplets, Info, Sprout, TrendingUp } from "lucide-react";
import { LEVEL_LABEL, type SuitabilityLevel } from "@/lib/geoai/crops";
import type { StoredDiagnostic } from "@/lib/geoai/service";
import { PRESSURE_LABEL } from "@/lib/geoai/water-economics";
import { cn, formatTnd } from "@/lib/utils";

const LEVEL_CLS: Record<SuitabilityLevel, string> = {
  very_good: "bg-forest-800 text-cream-50",
  good: "bg-olive-100 text-forest-900",
  low: "bg-gold-100 text-forest-900",
  unsuitable: "bg-cream-200 text-ink-600",
};
const NATURE_CLS = { mesuré: "bg-forest-800 text-cream-50", estimé: "bg-cream-200 text-ink-600", déclaré: "bg-olive-100 text-forest-800" } as const;

/** Diagnostic agricole (§6.4 F) et étude économique (§6.4 G). */
export function DiagnosticView({ diag, compact = false }: { diag: StoredDiagnostic; compact?: boolean }) {
  const d = diag.data;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {diag.status === "validated" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-olive-100 px-3 py-1 font-medium text-forest-800">
            <CheckCircle2 className="size-4" aria-hidden /> Relu et validé par VerdOlive
            {diag.validatedAt && ` le ${new Date(diag.validatedAt).toLocaleDateString("fr-FR")}`}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-3 py-1 font-medium text-forest-900">
            <Info className="size-4" aria-hidden /> Généré automatiquement, en attente de relecture
          </span>
        )}
        <span className="text-ink-400">Calculé le {new Date(d.generatedAt).toLocaleDateString("fr-FR")}</span>
      </div>

      <p className="text-lg text-ink-900">{d.summary}</p>
      {diag.validationNotes && <p className="rounded-xl bg-cream-100 p-3 text-sm text-ink-600">Note de l&apos;expert : {diag.validationNotes}</p>}

      {/* Aptitude par culture */}
      <section>
        <h3 className="flex items-center gap-2 font-semibold text-forest-900">
          <Sprout className="size-5 text-olive-600" aria-hidden /> Aptitude par culture
        </h3>
        <ul className="mt-3 space-y-2">
          {d.crops.slice(0, compact ? 4 : 7).map((c) => (
            <li key={c.crop} className="rounded-xl bg-cream-50 p-3 ring-1 ring-forest-900/5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="w-40 font-medium text-ink-900">{c.label}</span>
                <div className="h-2 min-w-24 flex-1 overflow-hidden rounded-full bg-cream-200" aria-hidden>
                  <span className={cn("block h-full rounded-full", c.score >= 75 ? "bg-forest-800" : c.score >= 55 ? "bg-olive-500" : c.score >= 35 ? "bg-gold-500" : "bg-ink-400")} style={{ width: `${c.score}%` }} />
                </div>
                <span className="w-12 text-right text-sm font-semibold text-ink-900">{c.score}</span>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", LEVEL_CLS[c.level])}>{LEVEL_LABEL[c.level]}</span>
              </div>
              {!compact && (c.constraints.length > 0 || c.irrigation !== "not_needed") && (
                <p className="mt-1.5 text-xs text-ink-600">
                  {c.irrigation === "needed" && "Irrigation nécessaire. "}
                  {c.constraints.join(" ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Pression sur l'eau (RES-04) */}
      {d.waterPressure && (
        <section className="rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-200">
          <h3 className="flex items-center gap-2 font-semibold text-sky-900">
            <Droplets className="size-5" aria-hidden /> Pression sur l&apos;eau ({d.crops.find((c) => c.crop === d.waterPressure!.crop)?.label.toLowerCase()})
            {d.waterPressure.level && (
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", d.waterPressure.level === "deficit" ? "bg-danger-600 text-white" : d.waterPressure.level === "limit" ? "bg-gold-500 text-forest-950" : "bg-forest-800 text-cream-50")}>
                {PRESSURE_LABEL[d.waterPressure.level]}
              </span>
            )}
          </h3>
          <p className="mt-2 text-sm text-ink-900">
            Besoin estimé : {d.waterPressure.needM3.toLocaleString("fr-FR")} m³/an
            {d.waterPressure.availableM3 != null && ` · disponible : ${d.waterPressure.availableM3.toLocaleString("fr-FR")} m³/an`}
          </p>
          <p className="mt-1 text-sm text-ink-600">{d.waterPressure.recommendation}</p>
          {!compact && <p className="mt-2 text-xs text-ink-400">{d.waterPressure.hypotheses.join(" ")}</p>}
        </section>
      )}

      {/* Étude économique */}
      {d.economics.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 font-semibold text-forest-900">
            <TrendingUp className="size-5 text-olive-600" aria-hidden /> Étude économique prévisionnelle
          </h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="text-ink-400">
                <tr className="border-b border-forest-900/10">
                  <th className="py-2 font-normal">Culture</th>
                  <th className="py-2 font-normal">Investissement initial</th>
                  <th className="py-2 font-normal">Recettes / an</th>
                  <th className="py-2 font-normal">Marge / an</th>
                  <th className="py-2 font-normal">Retour estimé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-900/5">
                {d.economics.map((e) => (
                  <tr key={e.crop}>
                    <td className="py-2.5 font-medium text-ink-900">
                      {d.crops.find((c) => c.crop === e.crop)?.label} <span className="text-xs font-normal text-ink-400">({e.mode === "irrigated" ? "irrigué" : "en sec"}, {e.areaHa} ha)</span>
                    </td>
                    <td className="py-2.5">{formatTnd(e.initialInvestmentTnd)}</td>
                    <td className="py-2.5">{formatTnd(e.annualRevenueTnd)}</td>
                    <td className="py-2.5">{formatTnd(e.annualMarginTnd)}</td>
                    <td className="py-2.5">{e.paybackYears != null ? `${e.paybackYears} ans` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!compact && <p className="mt-2 text-xs text-ink-400">{d.economics[0].hypotheses.join(" ")} Montée en production non comptée (hypothèse prudente).</p>}
        </section>
      )}

      {!compact && (
        <>
          <section>
            <h3 className="font-semibold text-forest-900">Données utilisées</h3>
            <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {d.dataPoints.map((p) => (
                <li key={p.label} className="flex items-center justify-between gap-2 rounded-lg bg-cream-50 px-3 py-1.5 text-sm">
                  <span className="text-ink-600">{p.label}</span>
                  <span className="flex items-center gap-2">
                    <strong className="font-medium text-ink-900">{p.value}</strong>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", NATURE_CLS[p.nature])} title={p.source}>
                      {p.nature}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
          {(d.recommendations.length > 0 || d.missing.length > 0) && (
            <section className="grid gap-4 md:grid-cols-2">
              {d.recommendations.length > 0 && (
                <div>
                  <h3 className="font-semibold text-forest-900">Recommandations</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-900">
                    {d.recommendations.map((r) => <li key={r}>{r}</li>)}
                  </ul>
                </div>
              )}
              {d.missing.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-forest-900">
                    <AlertTriangle className="size-4 text-warning-600" aria-hidden /> Données manquantes
                  </h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-600">
                    {d.missing.map((m) => <li key={m}>{m}</li>)}
                  </ul>
                </div>
              )}
            </section>
          )}
        </>
      )}
      <p className="text-xs text-ink-400">
        Outil d&apos;aide à la décision : ni expertise juridique, ni analyse de laboratoire, ni garantie de rendement ou de rentabilité. Sources : {d.sources.join(" ; ")}.
      </p>
    </div>
  );
}
