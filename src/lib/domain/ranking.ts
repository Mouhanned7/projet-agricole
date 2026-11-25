/**
 * Moteur de classement VerdOlive (cahier des charges §5).
 *
 * Source unique de vérité : utilisé côté serveur à chaque enregistrement d'un
 * dossier (CLA-01, résultat persisté en base) et côté client pour la jauge en
 * direct de l'assistant (TER-06).
 */
import type {
  LandForRanking,
  RankingResult,
  RankingStatus,
  TitleProof,
  WaterProof,
} from "./types";

/** Points des scores juridique et hydrique, réglables par l'administration (CLA-04). */
export const DEFAULT_WEIGHTS = {
  titre: 40, numero: 10, conservation: 5, proprietaires: 5, document: 15, propriete: 5, titreVerifie: 20,
  eau: 40, touteAnnee: 15, saisonniere: 7, debit: 15, profondeur: 5, salinite: 5, analyse: 5, documentee: 10, analysee: 15,
};
export type Weights = typeof DEFAULT_WEIGHTS;

export function normalizeWeights(v: unknown): Weights {
  const o = (v ?? {}) as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(DEFAULT_WEIGHTS).map(([k, d]) => [k, typeof o[k] === "number" && (o[k] as number) >= 0 && (o[k] as number) <= 100 ? o[k] : d]),
  ) as Weights;
}

const TITLE_NUMBER_RE = /^[\p{L}\p{N}\s/\-.]+$/u;

/** TER-03 : contrôle léger, jamais de format rigide (§3.2 C). */
export function validateTitleNumber(raw: string | null | undefined): { ok: boolean; warning?: string } {
  const v = (raw ?? "").trim();
  if (!v) return { ok: false, warning: "Le numéro du titre foncier est obligatoire." };
  if (v.length > 40) return { ok: false, warning: "Le numéro semble trop long (40 caractères maximum)." };
  if (!TITLE_NUMBER_RE.test(v))
    return { ok: false, warning: "Utilisez uniquement des lettres, chiffres, espaces, « / », « - » ou « . »." };
  if (v.length < 2) return { ok: true, warning: "Le numéro semble très court : vérifiez-le." };
  return { ok: true };
}

/** Normalisation utilisée pour la détection de doublons (TER-07). */
export function normalizeTitleNumber(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s./\-]+/g, "").replace(/^0+(?=\d)/, "");
}

export const STATUS_ORDER: Record<RankingStatus, number> = {
  priority: 0,
  needs_check: 1,
  low: 2,
  incomplete: 3,
};

const TITLE_PROOF_ORDER: Record<TitleProof, number> = { verified: 0, document: 1, declared: 2, none: 3 };

export const STATUS_LABEL: Record<RankingStatus, string> = {
  priority: "Prioritaire",
  needs_check: "Vérification nécessaire",
  low: "Non prioritaire",
  incomplete: "À compléter",
};

export function effectiveTitleProof(land: LandForRanking): TitleProof {
  const t = land.title;
  if (t.answer !== "yes") return "none";
  if (t.proof === "verified") return "verified";
  if (t.hasUpload || t.proof === "document") return "document";
  return validateTitleNumber(t.number).ok ? "declared" : "none";
}

/** Badge eau (§5.4) : « documentée » / « analysée » uniquement après décision de l'admin. */
export function effectiveWaterProof(land: LandForRanking): WaterProof {
  const w = land.water;
  if (w.answer !== "yes") return "none";
  if (w.proof === "analyzed" || w.proof === "documented") return w.proof;
  return "declared";
}

function essentialsComplete(land: LandForRanking): boolean {
  const e = land.essentials;
  const located = Boolean((e.governorate && e.delegation) || (e.lat != null && e.lng != null));
  return Boolean(e.objective && located && e.areaHa && e.areaHa > 0 && e.photoCount >= 1);
}

/** Problèmes qui empêchent la soumission (TER-01, TER-03, TER-04, RES-02, RES-03). */
function blockingIssues(land: LandForRanking): { titleWater: string[]; other: string[] } {
  const titleWater: string[] = [];
  const other: string[] = [];
  const { title: t, water: w, essentials: e } = land;

  if (!e.objective) other.push("Choisissez votre objectif : vendre, louer ou trouver un partenaire.");
  // Décision : sans localisation ni superficie, l'administration ne peut pas traiter le dossier.
  if (!e.governorate) other.push("Indiquez le gouvernorat et la délégation.");
  if (!e.areaHa || e.areaHa <= 0) other.push("Indiquez la superficie.");

  if (!t.answer) titleWater.push("Indiquez si le terrain a un titre foncier.");
  else if (t.answer === "yes") {
    const check = validateTitleNumber(t.number);
    if (!check.ok) titleWater.push(check.warning!);
    if (!t.ownership) titleWater.push("Précisez la nature de la propriété.");
  } else if (t.answer === "no" && !t.altDocument) {
    titleWater.push("Indiquez quel autre document existe (ou « aucun »).");
  }
  if (t.ownership === "joint" && !t.jointOwnersAgree)
    titleWater.push("Confirmez que tous les indivisaires sont d'accord.");

  if (!w.answer) titleWater.push("Indiquez si l'eau est disponible sur le terrain.");
  else if (w.answer === "yes") {
    if (!w.sources?.length) titleWater.push("Choisissez au moins une source d'eau.");
    if (!w.availability) titleWater.push("Précisez la disponibilité de l'eau dans l'année.");
    if (w.shared === "yes" && !w.sharedDetails?.trim())
      titleWater.push("Décrivez comment l'eau est partagée avec les autres exploitants.");
  } else if (w.answer === "no" && !w.nearbySource) {
    titleWater.push("Indiquez si une source d'eau existe à proximité.");
  }

  return { titleWater, other };
}

function legalScore(land: LandForRanking, proof: TitleProof, w: Weights): number {
  const t = land.title;
  let s = 0;
  if (t.answer === "yes") {
    s += w.titre;
    if (validateTitleNumber(t.number).ok) s += w.numero;
    if (t.registry) s += w.conservation;
    if (t.ownerNames) s += w.proprietaires;
    if (t.hasUpload) s += w.document;
    if (t.ownership === "individual" || (t.ownership === "joint" && t.jointOwnersAgree)) s += w.propriete;
    if (proof === "verified") s += w.titreVerifie;
  } else if (t.answer === "no") {
    if (t.altDocument && t.altDocument !== "none") s += 15;
    if (t.hasUpload) s += 10;
    if (t.registrationInProgress === "yes") s += 10;
  }
  return Math.min(100, s);
}

function waterScore(land: LandForRanking, proof: WaterProof, p: Weights): number {
  const w = land.water;
  if (w.answer !== "yes") return w.nearbySource === "yes" ? 10 : 0;
  let s = p.eau;
  if (w.availability === "year_round") s += p.touteAnnee;
  else if (w.availability === "seasonal") s += p.saisonniere;
  if (w.flow) s += p.debit;
  if (w.depthM != null) s += p.profondeur;
  if (w.salinityGL) s += p.salinite;
  if (w.hasAnalysisUpload) s += p.analyse;
  if (proof === "documented") s += p.documentee;
  if (proof === "analyzed") s += p.analysee;
  return Math.min(100, s);
}

/** Complétude + actions conseillées pour la jauge (§3.1). */
function completeness(land: LandForRanking): { score: number; actions: string[] } {
  const e = land.essentials;
  const x = land.extras ?? {};
  const items: [boolean, number, string][] = [
    [Boolean(e.objective), 10, "Choisissez votre objectif : vendre, louer ou trouver un partenaire."],
    [land.title.answer != null, 15, "Indiquez si le terrain a un titre foncier."],
    [land.title.answer !== "yes" || Boolean(land.title.number?.trim()), 10, "Le numéro du titre foncier est obligatoire."],
    [land.water.answer != null, 15, "Indiquez si l'eau est disponible sur le terrain."],
    [Boolean(e.governorate && e.delegation), 8, "Indiquez le gouvernorat et la délégation."],
    [e.lat != null && e.lng != null, 5, "Placez le terrain sur la carte."],
    [Boolean(e.areaHa && e.areaHa > 0), 8, "Indiquez la superficie."],
    [e.photoCount >= 1, 8, "Ajoutez au moins une photo du terrain."],
    [e.photoCount >= 4, 3, "Ajoutez plus de photos (4 ou plus)."],
    [Boolean(land.title.hasUpload), 5, "Téléversez le titre foncier ou le document de propriété."],
    [land.water.answer !== "yes" || Boolean(land.water.flow), 4, "Indiquez le débit de l'eau si vous le connaissez."],
    [Boolean(x.state), 3, "Décrivez l'état du terrain."],
    [Boolean(x.trees), 2, "Indiquez les arbres présents."],
    [Boolean(x.offerDetails), 4, "Complétez les conditions de votre offre."],
  ];
  const total = items.reduce((a, [, w]) => a + w, 0);
  const got = items.reduce((a, [ok, w]) => a + (ok ? w : 0), 0);
  return {
    score: Math.round((got / total) * 100),
    actions: items.filter(([ok]) => !ok).map(([, , msg]) => msg),
  };
}

const TITLE_REASON: Record<TitleProof, string> = {
  verified: "Titre vérifié",
  document: "Titre déclaré avec document",
  declared: "Titre déclaré",
  none: "",
};
const WATER_REASON: Record<WaterProof, string> = {
  analyzed: "eau analysée",
  documented: "eau documentée",
  declared: "eau déclarée",
  none: "",
};

export function computeRanking(land: LandForRanking, weights: Weights = DEFAULT_WEIGHTS): RankingResult {
  const titleProof = effectiveTitleProof(land);
  const waterProof = effectiveWaterProof(land);
  const issues = blockingIssues(land);
  const comp = completeness(land);
  const scores = {
    legal: legalScore(land, titleProof, weights),
    water: waterScore(land, waterProof, weights),
    completeness: comp.score,
    agri: land.agriScore ?? null,
  };
  const blocking = [...issues.other, ...issues.titleWater];

  let status: RankingStatus;
  const hasTitle = land.title.answer === "yes";
  const hasWater = land.water.answer === "yes";
  if (issues.titleWater.length > 0) status = "incomplete";
  else if (hasTitle && hasWater) status = essentialsComplete(land) ? "priority" : "needs_check";
  else if (hasTitle || hasWater) status = "needs_check";
  else status = "low";

  let reason: string;
  if (status === "incomplete") {
    reason = `À compléter : ${issues.titleWater[0].replace(/\.$/, "").toLowerCase()}`;
  } else {
    const titlePart =
      TITLE_REASON[titleProof] ||
      (land.title.answer === "unknown" ? "Titre non confirmé" : "Sans titre foncier");
    const waterPart = WATER_REASON[waterProof] || "sans eau sur le terrain";
    const docs = land.extras?.documentsCount ?? 0;
    const docPart = docs > 0 ? `${docs} document${docs > 1 ? "s" : ""}` : "aucun document";
    reason = `${titlePart}, ${waterPart}, ${docPart}`;
    if (hasTitle && hasWater && status === "needs_check") reason += " (informations essentielles à compléter)";
  }

  return {
    status,
    reason,
    titleProof,
    waterProof,
    scores,
    actions: [...new Set([...blocking, ...comp.actions])],
    canSubmit: blocking.length === 0,
    blockingIssues: blocking,
  };
}

export interface SortableLand {
  status: RankingStatus;
  titleProof: TitleProof;
  waterProof: WaterProof;
  hasFlow: boolean;
  agriScore: number | null;
  completeness: number;
  publishedAt: string | null;
}

export const SORT_CRITERIA = ["status", "title_proof", "water_proof", "agri_score", "completeness", "published_at"] as const;
export type SortCriterion = (typeof SORT_CRITERIA)[number];
export const DEFAULT_SORT_ORDER: SortCriterion[] = [...SORT_CRITERIA];

export const SORT_CRITERION_LABEL: Record<SortCriterion, string> = {
  status: "Statut de classement (titre × eau)",
  title_proof: "Preuve du titre foncier",
  water_proof: "Preuve de l'eau",
  agri_score: "Score agricole",
  completeness: "Complétude du dossier",
  published_at: "Date de publication",
};

const waterTier = (l: SortableLand) =>
  l.waterProof === "analyzed" ? 0 : l.waterProof === "documented" || l.hasFlow ? 1 : l.waterProof === "declared" ? 2 : 3;

const CRITERION_COMPARE: Record<SortCriterion, (a: SortableLand, b: SortableLand) => number> = {
  status: (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
  title_proof: (a, b) => TITLE_PROOF_ORDER[a.titleProof] - TITLE_PROOF_ORDER[b.titleProof],
  water_proof: (a, b) => waterTier(a) - waterTier(b),
  agri_score: (a, b) => (b.agriScore ?? -1) - (a.agriScore ?? -1),
  completeness: (a, b) => b.completeness - a.completeness,
  published_at: (a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
};

/** Ordre de tri réglable par l'administration (CLA-04) ; critères inconnus ignorés, manquants ajoutés à la fin. */
export function normalizeSortOrder(order: unknown): SortCriterion[] {
  const list = Array.isArray(order) ? order.filter((c): c is SortCriterion => SORT_CRITERIA.includes(c as SortCriterion)) : [];
  const unique = [...new Set(list)];
  return [...unique, ...SORT_CRITERIA.filter((c) => !unique.includes(c))];
}

export function compareWith(order: readonly SortCriterion[] = DEFAULT_SORT_ORDER) {
  return (a: SortableLand, b: SortableLand) => {
    for (const c of order) {
      const r = CRITERION_COMPARE[c](a, b);
      if (r !== 0) return r;
    }
    return 0;
  };
}

/** Tri « Recommandés » (§5.2) : chaque critère départage les égalités du précédent. */
export const compareRecommended = compareWith(DEFAULT_SORT_ORDER);
