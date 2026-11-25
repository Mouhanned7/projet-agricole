/** RES-11 : repère de prix par zone (médiane du prix à l'hectare des ventes publiées). Indicatif. */
import type { CatalogItem } from "./types";

export interface PriceBenchmark {
  perHa: number;
  low: number;
  high: number;
  count: number;
  zone: string;
}

const median = (v: number[]) => (v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2);

export function priceBenchmark(land: CatalogItem, all: CatalogItem[]): PriceBenchmark | null {
  const sales = all.filter((l) => l.id !== land.id && l.objective === "sale" && l.priceTnd && l.areaHa);
  const zones: [string, CatalogItem[]][] = [
    [land.delegation ?? "la délégation", sales.filter((l) => l.delegationId === land.delegationId)],
    [land.governorate ?? "le gouvernorat", sales.filter((l) => l.governorateId === land.governorateId)],
    ["Tunisie", sales],
  ];
  // La plus petite zone avec au moins 3 comparables.
  const found = zones.find(([, list]) => list.length >= 3);
  if (!found) return null;
  const v = found[1].map((l) => l.priceTnd! / l.areaHa!).sort((a, b) => a - b);
  return { perHa: Math.round(median(v)), low: Math.round(v[0]), high: Math.round(v[v.length - 1]), count: v.length, zone: found[0] };
}
