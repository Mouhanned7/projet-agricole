"use client";

import { Droplets, FileText, Loader2, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CROPS, DEFAULT_FILTERS, filtersToSearch, SORTS, type CatalogFilters, type SortKey } from "@/lib/catalog/filters";
import { GOVERNORATES, delegationId } from "@/lib/data/tunisia";
import { WATER_SOURCES } from "@/lib/lands/draft";
import { cn } from "@/lib/utils";

const OFFERS = [
  ["sale", "Vente"],
  ["rent", "Location"],
  ["partnership", "Partenariat"],
] as const;

function Segmented<T extends string>({
  label,
  icon,
  value,
  options,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-white p-1 ring-1 ring-forest-900/10">
      <span className="hidden pl-2 pr-1 text-forest-800 sm:block" aria-hidden>
        {icon}
      </span>
      {options.map(([v, l]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={cn(
            "min-h-9 whitespace-nowrap rounded-full px-3 text-sm transition-colors",
            value === v ? "bg-forest-900 font-medium text-cream-50" : "text-ink-600 hover:bg-forest-900/5",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "min-h-9 rounded-full px-3.5 text-sm ring-1 transition-colors",
        on ? "bg-olive-100 font-medium text-forest-900 ring-forest-800" : "bg-white text-ink-600 ring-forest-900/10 hover:ring-forest-900/30",
      )}
    >
      {children}
    </button>
  );
}

const toggleIn = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

function NumberBox({ label, value, onCommit, unit }: { label: string; value: number | null; onCommit: (v: number | null) => void; unit: string }) {
  const [text, setText] = useState(value?.toString() ?? "");
  useEffect(() => setText(value?.toString() ?? ""), [value]);
  const commit = () => {
    const n = text.trim() === "" ? null : Number(text.replace(",", "."));
    if (n === null || (Number.isFinite(n) && n >= 0)) onCommit(n);
  };
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-600">{label}</span>
      <span className="relative block">
        <input
          inputMode="decimal"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          className="w-full rounded-lg border border-forest-900/15 bg-white px-3 py-2 pr-10 text-sm focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-500/30"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-ink-400">{unit}</span>
      </span>
    </label>
  );
}

/** Filtres rapides toujours visibles + panneau de filtres avancés (§6.2, INV-02). */
export function FilterBar({ filters, total, basePath }: { filters: CatalogFilters; total: number; basePath?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const apply = (next: Partial<CatalogFilters>) => {
    const merged = { ...filters, ...next };
    if ("gouv" in next) merged.deleg = null;
    const q = filtersToSearch(merged);
    startTransition(() => router.replace(`${basePath ?? pathname}${q ? `?${q}` : ""}`, { scroll: false }));
  };

  const gov = GOVERNORATES.find((g) => g.id === filters.gouv);
  const advancedCount = (
    ["surfMin", "surfMax", "budMin", "budMax", "debitMin", "potentielMin", "plantations"] as const
  ).filter((k) => filters[k] != null).length + [filters.source, filters.dispo, filters.foncier, filters.culture, filters.statut].filter((l) => l.length).length + (filters.tous ? 1 : 0);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          label="Titre foncier"
          icon={<FileText className="size-4" />}
          value={filters.titre}
          onChange={(titre) => apply({ titre })}
          options={[
            ["tous", "Tous"],
            ["avec", "Avec titre foncier"],
            ["verifie", "Titre vérifié"],
          ]}
        />
        <Segmented
          label="Eau"
          icon={<Droplets className="size-4" />}
          value={filters.eau}
          onChange={(eau) => apply({ eau })}
          options={[
            ["tous", "Tous"],
            ["avec", "Avec eau"],
            ["preuve", "Documentée ou analysée"],
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {OFFERS.map(([v, l]) => (
          <Toggle key={v} on={filters.offre.includes(v)} onClick={() => apply({ offre: toggleIn(filters.offre, v) })}>
            {l}
          </Toggle>
        ))}
        <select
          aria-label="Gouvernorat"
          value={filters.gouv ?? ""}
          onChange={(e) => apply({ gouv: e.target.value || null })}
          className="min-h-9 rounded-full bg-white px-3 text-sm text-ink-900 ring-1 ring-forest-900/10"
        >
          <option value="">Tous les gouvernorats</option>
          {GOVERNORATES.map((g) => (
            <option key={g.id} value={g.id}>
              {g.fr}
            </option>
          ))}
        </select>
        {gov && (
          <select
            aria-label="Délégation"
            value={filters.deleg ?? ""}
            onChange={(e) => apply({ deleg: e.target.value || null })}
            className="min-h-9 rounded-full bg-white px-3 text-sm text-ink-900 ring-1 ring-forest-900/10"
          >
            <option value="">Toutes les délégations</option>
            {gov.delegations.map((d) => (
              <option key={d} value={delegationId(gov.id, d)}>
                {d}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-9 items-center gap-2 rounded-full bg-white px-3.5 text-sm font-medium text-forest-900 ring-1 ring-forest-900/10 hover:ring-forest-900/30"
        >
          <SlidersHorizontal className="size-4" aria-hidden /> Filtres avancés
          {advancedCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-gold-500 text-xs text-forest-950">{advancedCount}</span>}
        </button>
        <label className="ml-auto flex items-center gap-2 text-sm text-ink-600">
          <span className="hidden sm:inline">Trier par</span>
          <select
            value={filters.tri}
            onChange={(e) => apply({ tri: e.target.value as SortKey })}
            className="min-h-9 rounded-full bg-white px-3 text-sm text-ink-900 ring-1 ring-forest-900/10"
          >
            {Object.entries(SORTS).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </label>
        {pending && <Loader2 className="size-4 animate-spin text-ink-400" aria-label="Mise à jour" />}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-forest-950/40" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filtres avancés"
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full flex-col bg-cream-50 shadow-xl sm:max-w-md"
          >
            <div className="flex items-center justify-between border-b border-forest-900/10 px-5 py-4">
              <h2 className="text-lg font-semibold text-ink-900">Filtres avancés</h2>
              <button type="button" onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-full hover:bg-forest-900/5" aria-label="Fermer">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <section>
                <h3 className="text-sm font-semibold text-ink-900">Superficie</h3>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <NumberBox label="Minimum" unit="ha" value={filters.surfMin} onCommit={(surfMin) => apply({ surfMin })} />
                  <NumberBox label="Maximum" unit="ha" value={filters.surfMax} onCommit={(surfMax) => apply({ surfMax })} />
                </div>
              </section>
              <section>
                <h3 className="text-sm font-semibold text-ink-900">Budget</h3>
                <p className="text-xs text-ink-400">Prix pour une vente, loyer pour une location.</p>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <NumberBox label="Minimum" unit="DT" value={filters.budMin} onCommit={(budMin) => apply({ budMin })} />
                  <NumberBox label="Maximum" unit="DT" value={filters.budMax} onCommit={(budMax) => apply({ budMax })} />
                </div>
              </section>
              <section>
                <h3 className="text-sm font-semibold text-ink-900">Source d&apos;eau</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {WATER_SOURCES.map((s) => (
                    <Toggle key={s.value} on={filters.source.includes(s.value)} onClick={() => apply({ source: toggleIn(filters.source, s.value) })}>
                      {s.label}
                    </Toggle>
                  ))}
                </div>
              </section>
              <section>
                <h3 className="text-sm font-semibold text-ink-900">Disponibilité de l&apos;eau</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Toggle on={filters.dispo.includes("year_round")} onClick={() => apply({ dispo: toggleIn(filters.dispo, "year_round") })}>
                    Toute l&apos;année
                  </Toggle>
                  <Toggle on={filters.dispo.includes("seasonal")} onClick={() => apply({ dispo: toggleIn(filters.dispo, "seasonal") })}>
                    Saisonnière
                  </Toggle>
                </div>
              </section>
              <section>
                <NumberBox label="Débit minimal" unit="l/s" value={filters.debitMin} onCommit={(debitMin) => apply({ debitMin })} />
                <p className="mt-1 text-xs text-ink-400">Les terrains sans débit renseigné restent visibles.</p>
              </section>
              <section>
                <h3 className="text-sm font-semibold text-ink-900">Situation foncière</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(
                    [
                      ["declared", "Titre déclaré"],
                      ["document", "Document fourni"],
                      ["verified", "Vérifié"],
                    ] as const
                  ).map(([v, l]) => (
                    <Toggle key={v} on={filters.foncier.includes(v)} onClick={() => apply({ foncier: toggleIn(filters.foncier, v) })}>
                      {l}
                    </Toggle>
                  ))}
                </div>
              </section>
              <section>
                <h3 className="text-sm font-semibold text-ink-900">Culture souhaitée</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(Object.keys(CROPS) as (keyof typeof CROPS)[]).map((c) => (
                    <Toggle key={c} on={filters.culture.includes(c)} onClick={() => apply({ culture: toggleIn(filters.culture, c) })}>
                      {CROPS[c].label}
                    </Toggle>
                  ))}
                </div>
              </section>
              <section>
                <h3 className="text-sm font-semibold text-ink-900">Plantations existantes</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Toggle on={filters.plantations === "oui"} onClick={() => apply({ plantations: filters.plantations === "oui" ? null : "oui" })}>
                    Oui
                  </Toggle>
                  <Toggle on={filters.plantations === "non"} onClick={() => apply({ plantations: filters.plantations === "non" ? null : "non" })}>
                    Non
                  </Toggle>
                </div>
              </section>
              <section>
                <NumberBox label="Potentiel agricole minimal (0 à 100)" unit="" value={filters.potentielMin} onCommit={(potentielMin) => apply({ potentielMin })} />
                <p className="mt-1 text-xs text-ink-400">Disponible avec le diagnostic agricole (phase 2).</p>
              </section>
              <section>
                <h3 className="text-sm font-semibold text-ink-900">Statut de classement</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(
                    [
                      ["priority", "Prioritaire"],
                      ["needs_check", "Vérification nécessaire"],
                      ["low", "Non prioritaire"],
                    ] as const
                  ).map(([v, l]) => (
                    <Toggle key={v} on={filters.statut.includes(v)} onClick={() => apply({ statut: toggleIn(filters.statut, v) })}>
                      {l}
                    </Toggle>
                  ))}
                </div>
                <label className="mt-3 flex items-center gap-3 text-sm text-ink-900">
                  <input type="checkbox" checked={filters.tous} onChange={(e) => apply({ tous: e.target.checked })} className="size-5 accent-forest-800" />
                  Afficher aussi les terrains sans titre ni eau
                </label>
              </section>
            </div>
            <div className="flex gap-3 border-t border-forest-900/10 px-5 py-4">
              <button
                type="button"
                onClick={() => apply({ ...DEFAULT_FILTERS, titre: filters.titre, eau: filters.eau, offre: filters.offre, gouv: filters.gouv, tri: filters.tri })}
                className="min-h-12 rounded-full px-4 text-sm font-medium text-forest-800 underline underline-offset-2"
              >
                Effacer
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-forest-900 text-sm font-medium text-cream-50"
              >
                {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                Voir {total} résultat{total > 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
