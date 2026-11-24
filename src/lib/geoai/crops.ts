/**
 * Aptitude agricole par culture (§11.2) : règles agronomiques explicables,
 * appliquées aux données climatiques, de sol et d'eau. Fonctions pures.
 * Seuils indicatifs pour la Tunisie, à faire relire par un agronome.
 */

export interface SiteData {
  /** Pluie annuelle (mm). */
  rainMm: number | null;
  /** Température moyenne annuelle (°C). */
  tMean: number | null;
  /** Moyenne des minimales du mois le plus froid (°C). */
  tMinCold: number | null;
  /** Moyenne des maximales du mois le plus chaud (°C). */
  tMaxHot: number | null;
  /** Jours de gel (minimale < 0 °C). */
  frostDays: number | null;
  /** Jours « froids » (minimale < 7 °C), approximation des besoins en froid. */
  chillDays: number | null;
  /** Évapotranspiration de référence annuelle (mm). */
  et0Mm: number | null;
  elevationM: number | null;
  soilPh: number | null;
  clayPct: number | null;
  sandPct: number | null;
  water: { available: boolean; yearRound: boolean; salinityGL: number | null; flowLs: number | null };
}

export type CropKey = "olive" | "almond" | "date_palm" | "pistachio" | "pomegranate" | "fig" | "cereals";

export interface CropDef {
  key: CropKey;
  label: string;
  /** Pluie minimale pour une culture sans irrigation (mm/an) ; null : irrigation toujours nécessaire. */
  rainfedMinRain: number | null;
  /** Coefficient cultural moyen annuel (besoin en eau = ET0 × Kc). */
  kc: number;
  salinityMax: number;
  ph: [number, number];
  minChillDays: number;
  maxFrostDays: number;
  minTMaxHot?: number;
  /** Maximales du mois le plus chaud au-delà desquelles la culture souffre (°C). */
  maxTMaxHot: number;
  traditional: boolean;
}

export const CROPS: CropDef[] = [
  { key: "olive", label: "Olivier", rainfedMinRain: 200, kc: 0.6, salinityMax: 4, ph: [6.5, 8.8], minChillDays: 15, maxFrostDays: 15, maxTMaxHot: 42, traditional: true },
  { key: "almond", label: "Amandier", rainfedMinRain: 300, kc: 0.75, salinityMax: 2, ph: [6.5, 8.5], minChillDays: 30, maxFrostDays: 5, maxTMaxHot: 37, traditional: true },
  { key: "date_palm", label: "Palmier dattier", rainfedMinRain: null, kc: 0.95, salinityMax: 8, ph: [6.5, 8.8], minChillDays: 0, maxFrostDays: 3, minTMaxHot: 36, maxTMaxHot: 50, traditional: true },
  { key: "pistachio", label: "Pistachier", rainfedMinRain: 200, kc: 0.6, salinityMax: 4, ph: [7, 8.8], minChillDays: 40, maxFrostDays: 20, maxTMaxHot: 42, traditional: true },
  { key: "pomegranate", label: "Grenadier", rainfedMinRain: null, kc: 0.75, salinityMax: 3, ph: [5.5, 8.5], minChillDays: 10, maxFrostDays: 10, maxTMaxHot: 42, traditional: true },
  { key: "fig", label: "Figuier", rainfedMinRain: 400, kc: 0.65, salinityMax: 2.5, ph: [6, 8.5], minChillDays: 10, maxFrostDays: 10, maxTMaxHot: 39, traditional: true },
  { key: "cereals", label: "Céréales (blé dur, orge)", rainfedMinRain: 350, kc: 0.7, salinityMax: 3, ph: [6, 8.5], minChillDays: 20, maxFrostDays: 40, maxTMaxHot: 37, traditional: true },
];

export type SuitabilityLevel = "very_good" | "good" | "low" | "unsuitable";
export const LEVEL_LABEL: Record<SuitabilityLevel, string> = {
  very_good: "Très adapté",
  good: "Adapté",
  low: "Peu adapté",
  unsuitable: "Non adapté",
};

export interface CropSuitability {
  crop: CropKey;
  label: string;
  score: number;
  level: SuitabilityLevel;
  irrigation: "not_needed" | "needed" | "needed_missing";
  strengths: string[];
  constraints: string[];
}

export function levelOf(score: number): SuitabilityLevel {
  return score >= 75 ? "very_good" : score >= 55 ? "good" : score >= 35 ? "low" : "unsuitable";
}

export function evaluateCrop(c: CropDef, s: SiteData): CropSuitability {
  let score = 100;
  const strengths: string[] = [];
  const constraints: string[] = [];
  const pen = (points: number, why: string) => {
    score -= points;
    constraints.push(why);
  };

  // Eau : pluie suffisante ou irrigation disponible
  const rainOk = c.rainfedMinRain != null && s.rainMm != null && s.rainMm >= c.rainfedMinRain;
  let irrigation: CropSuitability["irrigation"] = "not_needed";
  if (!rainOk) {
    if (s.water.available) {
      irrigation = "needed";
      if (!s.water.yearRound) pen(12, "Eau saisonnière : l'irrigation d'été n'est pas garantie.");
      else strengths.push("Eau disponible toute l'année pour l'irrigation.");
    } else {
      irrigation = "needed_missing";
      pen(c.rainfedMinRain == null ? 70 : 45, c.rainfedMinRain == null ? "Culture irriguée, sans eau sur le terrain." : `Pluie insuffisante (${s.rainMm ?? "?"} mm/an, ${c.rainfedMinRain} mm requis) et pas d'eau sur le terrain.`);
    }
  } else strengths.push(`Pluie suffisante en culture sèche (${s.rainMm} mm/an).`);

  if (s.water.available && s.water.salinityGL != null) {
    if (s.water.salinityGL > c.salinityMax * 1.5) pen(35, `Eau trop salée (${s.water.salinityGL} g/l ; tolérance ${c.salinityMax} g/l).`);
    else if (s.water.salinityGL > c.salinityMax) pen(15, `Salinité de l'eau au-dessus de la tolérance (${s.water.salinityGL} g/l).`);
    else strengths.push("Salinité de l'eau compatible.");
  }

  if (s.frostDays != null && s.frostDays > c.maxFrostDays) pen(Math.min(30, (s.frostDays - c.maxFrostDays) * 2), `Gel fréquent (${s.frostDays} jours par an).`);
  if (s.chillDays != null && s.chillDays < c.minChillDays) pen(Math.min(30, (c.minChillDays - s.chillDays) * 1.5), `Hiver trop doux pour les besoins en froid (${s.chillDays} jours froids).`);
  if (c.minTMaxHot != null) {
    if (s.tMaxHot != null && s.tMaxHot < c.minTMaxHot) pen(Math.min(45, (c.minTMaxHot - s.tMaxHot) * 8), `Été pas assez chaud pour la maturation (${s.tMaxHot} °C au mois le plus chaud).`);
    else if (s.tMaxHot != null) strengths.push("Chaleur estivale suffisante pour la maturation.");
  }
  if (s.tMaxHot != null && s.tMaxHot > c.maxTMaxHot) pen(Math.min(35, (s.tMaxHot - c.maxTMaxHot) * 7), `Chaleur estivale excessive (${s.tMaxHot} °C au mois le plus chaud).`);

  // Débit disponible face au besoin de la culture (si irrigation nécessaire et débit connu)
  if (irrigation === "needed" && s.water.flowLs != null && s.et0Mm != null) {
    const needM3PerHa = (Math.max(0, s.et0Mm * c.kc - 0.7 * (s.rainMm ?? 0)) / 0.9) * 10;
    const haCovered = (s.water.flowLs * 3.6 * 8 * (s.water.yearRound ? 300 : 120)) / Math.max(needM3PerHa, 1);
    if (haCovered < 2) pen(20, `Débit déclaré suffisant pour environ ${Math.round(haCovered * 10) / 10} ha seulement.`);
    else strengths.push(`Débit suffisant pour irriguer environ ${Math.round(haCovered)} ha.`);
  }

  if (s.soilPh == null) pen(5, "Sol non caractérisé : incertitude sur l'aptitude.");
  if (s.soilPh != null) {
    if (s.soilPh < c.ph[0] || s.soilPh > c.ph[1]) pen(12, `pH du sol hors plage (${s.soilPh}).`);
    else strengths.push(`pH du sol favorable (${s.soilPh}).`);
  }
  if (s.clayPct != null && s.clayPct > 45 && c.key !== "cereals") pen(8, "Sol très argileux : risque d'asphyxie racinaire.");

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { crop: c.key, label: c.label, score, level: levelOf(score), irrigation, strengths, constraints };
}

export function rankCrops(s: SiteData): CropSuitability[] {
  return CROPS.map((c) => evaluateCrop(c, s)).sort((a, b) => b.score - a.score);
}

/** Données manquantes et analyses recommandées (§11.2). */
export function missingData(s: SiteData): string[] {
  const out: string[] = [];
  if (s.rainMm == null || s.tMean == null) out.push("Données climatiques indisponibles : relancer le diagnostic.");
  if (s.soilPh == null) out.push("Analyse de sol (pH, salinité, texture, azote) recommandée.");
  if (s.water.available && s.water.salinityGL == null) out.push("Analyse de l'eau (salinité) recommandée.");
  if (s.water.available && s.water.flowLs == null) out.push("Mesure du débit (essai de pompage) recommandée.");
  return out;
}
