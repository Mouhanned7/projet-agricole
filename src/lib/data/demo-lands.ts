/**
 * Terrains de démonstration : utilisés par la page d'accueil tant que
 * Supabase n'est pas branché, et par scripts/generate-seed.ts pour le seed SQL.
 * Toutes ces données sont fictives.
 */
import { computeRanking } from "../domain/ranking";
import type { LandForRanking, Objective, RankingResult } from "../domain/types";

export interface DemoLand extends LandForRanking {
  id: string;
  ref: string;
  name: string;
  objective: Objective;
  governorateId: string;
  governorate: string;
  delegation: string;
  lat: number;
  lng: number;
  areaHa: number;
  priceTnd?: number;
  rentTnd?: number;
  ownerSharePct?: number;
  crops: string;
  hue: number; // teinte du visuel de remplacement
  publishedAt: string;
}

type Seed = Omit<DemoLand, "essentials" | "id" | "ref"> & { photoCount?: number };

const seeds: Seed[] = [
  {
    name: "Oliveraie – Cap Bon", objective: "sale", governorateId: "nabeul", governorate: "Nabeul", delegation: "Korba",
    lat: 36.58, lng: 10.86, areaHa: 50, priceTnd: 850_000, crops: "Oliviers Chetoui, 40 ans", hue: 0,
    title: { answer: "yes", number: "45127/12", ownership: "individual", hasUpload: true, proof: "verified" },
    water: { answer: "yes", sources: ["well"], availability: "year_round", flow: { value: 4, unit: "l_s", nature: "measured" }, proof: "analyzed" },
    extras: { documentsCount: 3, state: true, trees: true, offerDetails: true }, publishedAt: "2026-11-02",
  },
  {
    name: "Oliveraie – Sfax", objective: "sale", governorateId: "sfax", governorate: "Sfax", delegation: "Agareb",
    lat: 34.74, lng: 10.47, areaHa: 75, priceTnd: 1_200_000, crops: "Oliviers Chemlali", hue: 20,
    title: { answer: "yes", number: "88412/Sfax", ownership: "individual", hasUpload: true },
    water: { answer: "yes", sources: ["borehole"], availability: "year_round", flow: { value: 6, unit: "l_s", nature: "declared" } },
    extras: { documentsCount: 2, state: true, trees: true, offerDetails: true }, publishedAt: "2026-11-10",
  },
  {
    name: "Terrain agricole – Mahdia", objective: "partnership", governorateId: "mahdia", governorate: "Mahdia", delegation: "Ksour Essef",
    lat: 35.42, lng: 10.99, areaHa: 120, ownerSharePct: 40, crops: "Terre nue, ancien céréalier", hue: -15,
    title: { answer: "yes", number: "10233", ownership: "joint", jointOwnersAgree: true },
    water: { answer: "yes", sources: ["well", "cistern"], availability: "seasonal", shared: "yes", sharedDetails: "Puits partagé avec la parcelle voisine, tour d'eau le mardi." },
    extras: { documentsCount: 0, state: true, offerDetails: true }, publishedAt: "2026-11-18",
  },
  {
    name: "Verger d'amandiers – Sidi Bouzid", objective: "rent", governorateId: "sidi-bouzid", governorate: "Sidi Bouzid", delegation: "Regueb",
    lat: 34.86, lng: 9.79, areaHa: 30, rentTnd: 18_000, crops: "Amandiers, 12 ans", hue: 10,
    title: { answer: "yes", number: "7781/SB", ownership: "individual" },
    water: { answer: "no", nearbySource: "yes", nearbyDistanceKm: 1.5 },
    extras: { documentsCount: 1, state: true, trees: true, offerDetails: true }, publishedAt: "2026-11-15",
  },
  {
    name: "Palmeraie – Tozeur", objective: "partnership", governorateId: "tozeur", governorate: "Tozeur", delegation: "Nefta",
    lat: 33.87, lng: 7.88, areaHa: 8, ownerSharePct: 50, crops: "Palmiers Deglet Nour", hue: 35,
    title: { answer: "unknown" },
    water: { answer: "yes", sources: ["network"], availability: "year_round" },
    extras: { documentsCount: 0, state: true, trees: true, offerDetails: true }, publishedAt: "2026-11-20",
  },
  {
    name: "Oliveraie – Zaghouan", objective: "sale", governorateId: "zaghouan", governorate: "Zaghouan", delegation: "El Fahs",
    lat: 36.37, lng: 9.9, areaHa: 60, priceTnd: 990_000, crops: "Oliviers, 25 ans", hue: 5,
    title: { answer: "yes", number: "3321/Z", ownership: "individual" },
    water: { answer: "yes", sources: ["borehole"], availability: "year_round" },
    extras: { documentsCount: 1, state: true, trees: true, offerDetails: true }, publishedAt: "2026-11-21",
  },
  {
    name: "Terre de culture – Kairouan", objective: "rent", governorateId: "kairouan", governorate: "Kairouan", delegation: "Haffouz",
    lat: 35.63, lng: 9.67, areaHa: 40, rentTnd: 12_000, crops: "Céréales", hue: 25,
    title: { answer: "no", altDocument: "adoulaire", registrationInProgress: "yes" },
    water: { answer: "no", nearbySource: "no", rainfed: true },
    extras: { documentsCount: 1, state: true, offerDetails: true }, publishedAt: "2026-11-12",
  },
];

export const DEMO_LANDS: (DemoLand & { ranking: RankingResult })[] = seeds.map((s, i) => {
  const land: DemoLand = {
    ...s,
    id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    ref: `VO-DEMO${i + 1}`,
    essentials: {
      objective: s.objective,
      governorate: s.governorateId,
      delegation: s.delegation,
      lat: s.lat,
      lng: s.lng,
      areaHa: s.areaHa,
      photoCount: s.photoCount ?? 4,
    },
  };
  return { ...land, ranking: computeRanking(land) };
});
