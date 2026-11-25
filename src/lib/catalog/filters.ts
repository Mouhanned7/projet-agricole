/**
 * Filtres et tri du catalogue (§6.2, §6.3). Fonctions pures : utilisées par le
 * serveur pour la liste, la carte et le compteur de résultats.
 *
 * Règles (§6.2 C) :
 * - filtres de types différents : ET ; options d'un même filtre : OU ;
 * - un filtre avancé n'exclut pas un terrain dont la donnée n'est pas renseignée,
 *   sauf les filtres rapides Titre et Eau.
 */
import { compareWith, DEFAULT_SORT_ORDER, type SortCriterion } from "@/lib/domain/ranking";
import { EQUIPMENT, SOIL_TYPES } from "@/lib/lands/draft";
import type { CatalogItem } from "./types";

export const SORTS = {
  recommandes: "Recommandés",
  prix_asc: "Prix croissant",
  prix_desc: "Prix décroissant",
  surface_asc: "Superficie croissante",
  surface_desc: "Superficie décroissante",
  potentiel: "Potentiel agricole",
  recents: "Plus récents",
  debit: "Débit d'eau",
} as const;
export type SortKey = keyof typeof SORTS;

export const CROPS = {
  olivier: { label: "Olivier", match: /olivi|chemlali|chetoui|olive/i },
  amandier: { label: "Amandier", match: /amand/i },
  palmier: { label: "Palmier dattier", match: /palmier|datt|deglet/i },
  autre: { label: "Autres cultures", match: /^(?!.*(olivi|chemlali|chetoui|olive|amand|palmier|datt|deglet)).+/i },
} as const;
export type CropKey = keyof typeof CROPS;

export interface CatalogFilters {
  titre: "tous" | "avec" | "verifie";
  eau: "tous" | "avec" | "preuve";
  offre: ("sale" | "rent" | "partnership")[];
  gouv: string | null;
  deleg: string | null;
  surfMin: number | null;
  surfMax: number | null;
  budMin: number | null;
  budMax: number | null;
  source: string[];
  dispo: ("year_round" | "seasonal")[];
  debitMin: number | null;
  foncier: ("declared" | "document" | "verified")[];
  culture: CropKey[];
  potentielMin: number | null;
  statut: ("priority" | "needs_check" | "low")[];
  plantations: "oui" | "non" | null;
  sol: string[];
  equip: string[];
  /** Afficher aussi les terrains sans titre ni eau (cas D, décision D4). */
  tous: boolean;
  tri: SortKey;
}

export const DEFAULT_FILTERS: CatalogFilters = {
  titre: "tous",
  eau: "tous",
  offre: [],
  gouv: null,
  deleg: null,
  surfMin: null,
  surfMax: null,
  budMin: null,
  budMax: null,
  source: [],
  dispo: [],
  debitMin: null,
  foncier: [],
  culture: [],
  potentielMin: null,
  statut: [],
  plantations: null,
  sol: [],
  equip: [],
  tous: false,
  tri: "recommandes",
};

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;
const list = <T extends string>(v: string | string[] | undefined, allowed: readonly T[]): T[] => {
  const raw = (Array.isArray(v) ? v.join(",") : (v ?? "")).split(",").map((x) => x.trim());
  return [...new Set(raw.filter((x): x is T => (allowed as readonly string[]).includes(x)))];
};
const num = (v: string | string[] | undefined) => {
  const s = one(v);
  if (s == null || s === "") return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const pick = <T extends string>(v: string | string[] | undefined, allowed: readonly T[], fallback: T): T => {
  const s = one(v);
  return s && (allowed as readonly string[]).includes(s) ? (s as T) : fallback;
};

/** Lit les filtres depuis l'adresse de la page (§6.2 C : recherche partageable). */
export function parseFilters(p: Params): CatalogFilters {
  return {
    titre: pick(p.titre, ["tous", "avec", "verifie"], "tous"),
    eau: pick(p.eau, ["tous", "avec", "preuve"], "tous"),
    offre: list(p.offre, ["sale", "rent", "partnership"]),
    gouv: one(p.gouv),
    deleg: one(p.gouv) ? one(p.deleg) : null,
    surfMin: num(p.surfMin),
    surfMax: num(p.surfMax),
    budMin: num(p.budMin),
    budMax: num(p.budMax),
    source: list(p.source, ["well", "borehole", "network", "cistern", "other"]),
    dispo: list(p.dispo, ["year_round", "seasonal"]),
    debitMin: num(p.debitMin),
    foncier: list(p.foncier, ["declared", "document", "verified"]),
    culture: list(p.culture, Object.keys(CROPS) as CropKey[]),
    potentielMin: num(p.potentielMin),
    statut: list(p.statut, ["priority", "needs_check", "low"]),
    plantations: (pick(p.plantations, ["oui", "non", ""], "") || null) as CatalogFilters["plantations"],
    sol: list(p.sol, SOIL_TYPES),
    equip: list(p.equip, EQUIPMENT),
    tous: one(p.tous) === "1",
    tri: pick(p.tri, Object.keys(SORTS) as SortKey[], "recommandes"),
  };
}

/** Écrit les filtres dans l'adresse (seulement ceux qui diffèrent des valeurs par défaut). */
export function filtersToSearch(f: CatalogFilters): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(f) as [keyof CatalogFilters, CatalogFilters[keyof CatalogFilters]][]) {
    const def = DEFAULT_FILTERS[k];
    if (Array.isArray(v)) {
      if (v.length) q.set(k, v.join(","));
    } else if (typeof v === "boolean") {
      if (v) q.set(k, "1");
    } else if (v != null && v !== def) q.set(k, String(v));
  }
  return q.toString();
}

function budgetOf(l: CatalogItem): number | null {
  if (l.objective === "sale") return l.priceTnd;
  if (l.objective === "rent") return l.rentTnd;
  return null; // partenariat : apport à discuter
}

function cropText(l: CatalogItem): string {
  return [l.crops ?? "", ...l.trees.map((t) => t.species)].join(" ").trim();
}

type Test = { key: string; label: string; test: (l: CatalogItem) => boolean };

/** Liste des filtres actifs, chacun avec son libellé (pastilles supprimables). */
export function activeTests(f: CatalogFilters): Test[] {
  const t: Test[] = [];
  const unknownOk = <T>(v: T | null | undefined, ok: (x: T) => boolean) => v == null || ok(v);

  if (f.titre === "avec") t.push({ key: "titre", label: "Avec titre foncier", test: (l) => l.titleAnswer === "yes" });
  if (f.titre === "verifie") t.push({ key: "titre", label: "Titre vérifié", test: (l) => l.titleProof === "verified" });
  if (f.eau === "avec") t.push({ key: "eau", label: "Avec eau", test: (l) => l.waterAnswer === "yes" });
  if (f.eau === "preuve")
    t.push({ key: "eau", label: "Eau documentée ou analysée", test: (l) => l.waterProof === "documented" || l.waterProof === "analyzed" });
  if (f.offre.length) {
    const labels = { sale: "Vente", rent: "Location", partnership: "Partenariat" };
    t.push({ key: "offre", label: f.offre.map((o) => labels[o]).join(" ou "), test: (l) => f.offre.includes(l.objective) });
  }
  if (f.gouv) t.push({ key: "gouv", label: "Gouvernorat", test: (l) => l.governorateId === f.gouv });
  if (f.deleg) t.push({ key: "deleg", label: "Délégation", test: (l) => l.delegationId === f.deleg });
  if (f.surfMin != null) t.push({ key: "surfMin", label: `≥ ${f.surfMin} ha`, test: (l) => unknownOk(l.areaHa, (a) => a >= f.surfMin!) });
  if (f.surfMax != null) t.push({ key: "surfMax", label: `≤ ${f.surfMax} ha`, test: (l) => unknownOk(l.areaHa, (a) => a <= f.surfMax!) });
  if (f.budMin != null) t.push({ key: "budMin", label: `Budget ≥ ${f.budMin} DT`, test: (l) => unknownOk(budgetOf(l), (b) => b >= f.budMin!) });
  if (f.budMax != null) t.push({ key: "budMax", label: `Budget ≤ ${f.budMax} DT`, test: (l) => unknownOk(budgetOf(l), (b) => b <= f.budMax!) });
  if (f.source.length)
    t.push({
      key: "source",
      label: "Source d'eau",
      // Un terrain déclaré sans eau n'a pas de source : exclu. Donnée non renseignée : conservé.
      test: (l) => l.waterAnswer !== "no" && (!l.waterSources.length || l.waterSources.some((s) => f.source.includes(s))),
    });
  if (f.dispo.length)
    t.push({
      key: "dispo",
      label: f.dispo.map((d) => (d === "year_round" ? "Eau toute l'année" : "Eau saisonnière")).join(" ou "),
      test: (l) => l.waterAnswer !== "no" && unknownOk(l.waterAvailability, (a) => (f.dispo as string[]).includes(a)),
    });
  if (f.debitMin != null)
    t.push({ key: "debitMin", label: `Débit ≥ ${f.debitMin} l/s`, test: (l) => l.waterAnswer !== "no" && unknownOk(l.flowLs, (d) => d >= f.debitMin!) });
  if (f.foncier.length) {
    const labels = { declared: "Titre déclaré", document: "Document fourni", verified: "Titre vérifié" };
    t.push({ key: "foncier", label: f.foncier.map((x) => labels[x]).join(" ou "), test: (l) => (f.foncier as string[]).includes(l.titleProof) });
  }
  if (f.culture.length)
    t.push({
      key: "culture",
      label: f.culture.map((c) => CROPS[c].label).join(" ou "),
      test: (l) => {
        const text = cropText(l);
        return !text || f.culture.some((c) => CROPS[c].match.test(text));
      },
    });
  if (f.potentielMin != null)
    t.push({ key: "potentielMin", label: `Potentiel ≥ ${f.potentielMin}`, test: (l) => unknownOk(l.scoreAgri, (s) => s >= f.potentielMin!) });
  if (f.plantations)
    t.push({
      key: "plantations",
      label: f.plantations === "oui" ? "Avec plantations" : "Sans plantations",
      test: (l) => (f.plantations === "oui" ? l.trees.length > 0 : l.trees.length === 0),
    });
  if (f.sol.length) t.push({ key: "sol", label: `Sol ${f.sol.join(" ou ")}`, test: (l) => unknownOk(l.extra.soilType, (v) => f.sol.includes(v)) });
  if (f.equip.length)
    t.push({ key: "equip", label: f.equip.join(" ou "), test: (l) => !l.extra.equipment?.length || l.extra.equipment.some((e) => f.equip.includes(e)) });
  if (f.statut.length) {
    const labels = { priority: "Prioritaire", needs_check: "Vérification nécessaire", low: "Non prioritaire" };
    t.push({ key: "statut", label: f.statut.map((s) => labels[s]).join(" ou "), test: (l) => (f.statut as string[]).includes(l.rankingStatus) });
  }
  return t;
}

/** Cas D masqué par défaut, sauf demande explicite (filtre « tous » ou statut Non prioritaire). */
function lowVisible(f: CatalogFilters, showLowByDefault: boolean) {
  return showLowByDefault || f.tous || f.statut.includes("low");
}

const nullsLast = (a: number | null, b: number | null, dir: 1 | -1) =>
  a == null && b == null ? 0 : a == null ? 1 : b == null ? -1 : (a - b) * dir;

export function sortItems(items: CatalogItem[], tri: SortKey, order: readonly SortCriterion[] = DEFAULT_SORT_ORDER): CatalogItem[] {
  const rec = compareWith(order);
  const recKey = (l: CatalogItem) => ({
    status: l.rankingStatus,
    titleProof: l.titleProof,
    waterProof: l.waterProof,
    hasFlow: l.flowLs != null,
    agriScore: l.scoreAgri,
    completeness: l.scoreCompleteness,
    publishedAt: l.publishedAt,
  });
  const recommended = (a: CatalogItem, b: CatalogItem) => rec(recKey(a), recKey(b));
  const by: Record<SortKey, (a: CatalogItem, b: CatalogItem) => number> = {
    recommandes: recommended,
    // Les terrains sans prix (partenariat) en fin de liste (§6.3)
    prix_asc: (a, b) => nullsLast(budgetOf(a), budgetOf(b), 1),
    prix_desc: (a, b) => nullsLast(budgetOf(a), budgetOf(b), -1),
    surface_asc: (a, b) => nullsLast(a.areaHa, b.areaHa, 1),
    surface_desc: (a, b) => nullsLast(a.areaHa, b.areaHa, -1),
    potentiel: (a, b) => nullsLast(a.scoreAgri, b.scoreAgri, -1),
    recents: (a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
    debit: (a, b) => nullsLast(a.flowLs, b.flowLs, -1),
  };
  return [...items].sort((a, b) => by[tri](a, b) || recommended(a, b));
}

export interface CatalogResult {
  items: CatalogItem[];
  total: number;
  hiddenLow: number;
  active: { key: string; label: string }[];
  /** Aucun résultat : filtre dont le retrait donne le plus de terrains. */
  suggestion: { key: string; label: string; count: number } | null;
}

export function applyFilters(
  all: CatalogItem[],
  f: CatalogFilters,
  opts: { showLowByDefault?: boolean; sortOrder?: readonly SortCriterion[] } = {},
): CatalogResult {
  const tests = activeTests(f);
  const showLow = lowVisible(f, opts.showLowByDefault ?? false);
  const run = (ts: Test[]) => all.filter((l) => (showLow || l.rankingStatus !== "low") && ts.every((t) => t.test(l)));
  const matched = run(tests);
  const hiddenLow = showLow ? 0 : all.filter((l) => l.rankingStatus === "low" && tests.every((t) => t.test(l))).length;

  let suggestion: CatalogResult["suggestion"] = null;
  if (matched.length === 0 && tests.length) {
    for (const t of tests) {
      const count = run(tests.filter((x) => x !== t)).length;
      if (count > (suggestion?.count ?? 0)) suggestion = { key: t.key, label: t.label, count };
    }
  }
  return {
    items: sortItems(matched, f.tri, opts.sortOrder),
    total: matched.length,
    hiddenLow,
    active: tests.map(({ key, label }) => ({ key, label })),
    suggestion,
  };
}

/** Retire un filtre (pastille supprimable). */
export function withoutFilter(f: CatalogFilters, key: string): CatalogFilters {
  const k = key as keyof CatalogFilters;
  const next = { ...f, [k]: DEFAULT_FILTERS[k] } as CatalogFilters;
  if (k === "gouv") next.deleg = null;
  return next;
}
