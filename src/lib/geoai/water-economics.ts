/**
 * Pression sur l'eau (RES-04) et étude économique prévisionnelle (§6.4 G).
 * Fonctions pures, hypothèses affichées. Outils d'aide à la décision :
 * aucune garantie de rendement ni de rentabilité.
 */
import { CROPS, type CropKey } from "./crops";

export type WaterPressureLevel = "sufficient" | "limit" | "deficit";
export const PRESSURE_LABEL: Record<WaterPressureLevel, string> = { sufficient: "Suffisant", limit: "Limite", deficit: "Déficit" };

export interface WaterPressure {
  crop: CropKey;
  needM3PerHa: number;
  needM3: number;
  availableM3: number | null;
  ratio: number | null;
  level: WaterPressureLevel | null;
  recommendation: string;
  hypotheses: string[];
}

/** Hypothèses de pompage : 8 h/jour, 300 jours (eau toute l'année) ou 120 jours (saisonnière). */
export const PUMP_HOURS = 8;

export function waterPressure(input: {
  crop: CropKey;
  et0Mm: number | null;
  rainMm: number | null;
  areaHa: number;
  flowLs: number | null;
  yearRound: boolean;
  dripEfficiency?: number;
}): WaterPressure {
  const crop = CROPS.find((c) => c.key === input.crop)!;
  const eff = input.dripEfficiency ?? 0.9;
  const et0 = input.et0Mm ?? 1300;
  const effectiveRain = 0.7 * (input.rainMm ?? 250);
  const needMm = Math.max(0, et0 * crop.kc - effectiveRain) / eff;
  const needM3PerHa = Math.round(needMm * 10);
  const needM3 = Math.round(needM3PerHa * input.areaHa);
  const days = input.yearRound ? 300 : 120;
  const availableM3 = input.flowLs != null ? Math.round(input.flowLs * 3.6 * PUMP_HOURS * days) : null;
  const ratio = availableM3 != null && needM3 > 0 ? Math.round((availableM3 / needM3) * 100) / 100 : null;
  const level: WaterPressureLevel | null = ratio == null ? null : ratio >= 1.1 ? "sufficient" : ratio >= 0.8 ? "limit" : "deficit";
  const recommendation =
    level === "deficit"
      ? `Le débit couvre environ ${Math.round((ratio ?? 0) * 100)} % du besoin : réduire la surface irriguée, choisir une culture plus sobre ou prévoir un stockage (bassin).`
      : level === "limit"
        ? "Débit juste suffisant : irrigation goutte-à-goutte et pilotage précis recommandés."
        : level === "sufficient"
          ? "Débit suffisant pour cette culture sur la surface exploitable."
          : "Débit non renseigné : une mesure (essai de pompage) est nécessaire pour conclure.";
  return {
    crop: input.crop,
    needM3PerHa,
    needM3,
    availableM3,
    ratio,
    level,
    recommendation,
    hypotheses: [
      `Besoin = ET0 × Kc (${crop.kc}) − 70 % de la pluie, irrigation goutte-à-goutte (efficience ${Math.round(eff * 100)} %).`,
      `Volume disponible = débit × ${PUMP_HOURS} h/jour × ${days} jours.`,
      input.et0Mm == null ? "ET0 non disponible : valeur par défaut de 1 300 mm/an." : `ET0 de la zone : ${Math.round(et0)} mm/an.`,
    ],
  };
}

/** Hypothèses économiques par hectare (TND, prix 2026 indicatifs, à valider). */
export interface CropEconomics {
  plantingTnd: number;
  irrigationTnd: number;
  annualCostTnd: number;
  yieldKg: number;
  priceTnd: number;
  yearsToMaturity: number;
  product: string;
}

export const ECONOMICS: Record<CropKey, { irrigated: CropEconomics; rainfed?: CropEconomics }> = {
  olive: {
    irrigated: { plantingTnd: 6000, irrigationTnd: 5000, annualCostTnd: 2500, yieldKg: 6000, priceTnd: 1.6, yearsToMaturity: 5, product: "olives" },
    rainfed: { plantingTnd: 3500, irrigationTnd: 0, annualCostTnd: 800, yieldKg: 1500, priceTnd: 1.6, yearsToMaturity: 7, product: "olives" },
  },
  almond: {
    irrigated: { plantingTnd: 7000, irrigationTnd: 5000, annualCostTnd: 3000, yieldKg: 2000, priceTnd: 7, yearsToMaturity: 5, product: "amandes en coque" },
    rainfed: { plantingTnd: 4000, irrigationTnd: 0, annualCostTnd: 1000, yieldKg: 600, priceTnd: 7, yearsToMaturity: 6, product: "amandes en coque" },
  },
  date_palm: { irrigated: { plantingTnd: 15000, irrigationTnd: 6000, annualCostTnd: 6000, yieldKg: 7000, priceTnd: 3.5, yearsToMaturity: 6, product: "dattes" } },
  pistachio: {
    irrigated: { plantingTnd: 6000, irrigationTnd: 4000, annualCostTnd: 2000, yieldKg: 1500, priceTnd: 18, yearsToMaturity: 8, product: "pistaches en coque" },
    rainfed: { plantingTnd: 3500, irrigationTnd: 0, annualCostTnd: 700, yieldKg: 450, priceTnd: 18, yearsToMaturity: 9, product: "pistaches en coque" },
  },
  pomegranate: { irrigated: { plantingTnd: 8000, irrigationTnd: 5000, annualCostTnd: 4000, yieldKg: 15000, priceTnd: 1.5, yearsToMaturity: 4, product: "grenades" } },
  fig: {
    irrigated: { plantingTnd: 6000, irrigationTnd: 4000, annualCostTnd: 2500, yieldKg: 8000, priceTnd: 2.5, yearsToMaturity: 4, product: "figues" },
    rainfed: { plantingTnd: 3500, irrigationTnd: 0, annualCostTnd: 900, yieldKg: 3000, priceTnd: 2.5, yearsToMaturity: 5, product: "figues" },
  },
  cereals: { irrigated: { plantingTnd: 0, irrigationTnd: 3000, annualCostTnd: 1500, yieldKg: 4000, priceTnd: 1.1, yearsToMaturity: 1, product: "grain" }, rainfed: { plantingTnd: 0, irrigationTnd: 0, annualCostTnd: 900, yieldKg: 1800, priceTnd: 1.1, yearsToMaturity: 1, product: "grain" } },
};

export interface EconomicEstimate {
  crop: CropKey;
  mode: "irrigated" | "rainfed";
  areaHa: number;
  initialInvestmentTnd: number;
  annualCostTnd: number;
  annualRevenueTnd: number;
  annualMarginTnd: number;
  yearsToMaturity: number;
  /** Années depuis la plantation pour récupérer l'investissement (null si marge ≤ 0). */
  paybackYears: number | null;
  production: string;
  hypotheses: string[];
}

export function economicEstimate(crop: CropKey, areaHa: number, irrigated: boolean): EconomicEstimate {
  const table = ECONOMICS[crop];
  const mode = irrigated || !table.rainfed ? "irrigated" : "rainfed";
  const e = mode === "irrigated" ? table.irrigated : table.rainfed!;
  const initial = Math.round((e.plantingTnd + e.irrigationTnd) * areaHa);
  const cost = Math.round(e.annualCostTnd * areaHa);
  const revenue = Math.round(e.yieldKg * e.priceTnd * areaHa);
  const margin = revenue - cost;
  // Avant maturité : charges sans recette (montée en production ignorée, hypothèse prudente).
  const beforeMaturity = cost * (e.yearsToMaturity - 1);
  const payback = margin > 0 ? Math.round((e.yearsToMaturity - 1 + (initial + beforeMaturity) / margin) * 10) / 10 : null;
  return {
    crop,
    mode,
    areaHa,
    initialInvestmentTnd: initial,
    annualCostTnd: cost,
    annualRevenueTnd: revenue,
    annualMarginTnd: margin,
    yearsToMaturity: e.yearsToMaturity,
    paybackYears: payback,
    production: `${Math.round(e.yieldKg * areaHa).toLocaleString("fr-FR")} kg de ${e.product} par an à maturité`,
    hypotheses: [
      `Plantation ${e.plantingTnd} TND/ha${e.irrigationTnd ? `, irrigation ${e.irrigationTnd} TND/ha` : ""}, charges ${e.annualCostTnd} TND/ha/an.`,
      `Rendement à maturité ${e.yieldKg} kg/ha, prix ${e.priceTnd} TND/kg, pleine production en année ${e.yearsToMaturity}.`,
      "Prix et coûts indicatifs 2026 : à confirmer par un expert avant toute décision.",
    ],
  };
}
