/**
 * Brouillon d'un terrain (assistant « Ajouter mon terrain », §3).
 * Un seul objet sérialisable pour les 7 étapes ; converti vers les lignes SQL
 * (toRows) et vers l'entrée du moteur de classement (toRankingInput).
 */
import { z } from "zod";
import type { LandForRanking } from "../domain/types";

const str = (max = 500) => z.string().trim().max(max).nullish().transform((v) => v || null);
const num = (min = 0, max = 1e9) => z.number().min(min).max(max).nullish().transform((v) => (v ?? null));
const yesNoUnknown = z.enum(["yes", "no", "unknown"]).nullish().transform((v) => v ?? null);
const bool = z.boolean().nullish().transform((v) => v ?? null);
const list = (max = 20) => z.array(z.string().max(60)).max(max).default([]);

export const WATER_SOURCES = [
  { value: "well", label: "Puits" },
  { value: "borehole", label: "Forage / sondage" },
  { value: "network", label: "Réseau (SONEDE, groupement…)" },
  { value: "cistern", label: "Citerne / retenue" },
  { value: "other", label: "Autre" },
] as const;

export const SALE_INCLUDED = ["Arbres", "Puits", "Système d'irrigation", "Bâtiments", "Équipements", "Clôture"] as const;
export const SOIL_TYPES = ["Argileux", "Sableux", "Limoneux", "Calcaire", "Mixte", "Je ne sais pas"] as const;
export const EQUIPMENT = ["Irrigation", "Clôture", "Bâtiment", "Bassin", "Pompe", "Électricité", "Panneaux solaires"] as const;
export const PRACTICES = ["Irrigation goutte-à-goutte", "Couverture du sol", "Compost", "Gestion de la salinité", "Protection des travailleurs", "Limitation des produits chimiques"] as const;
export const OWNER_CONTRIBUTIONS = ["Mise à disposition du terrain", "Travail", "Suivi local", "Équipements"] as const;
export const INVESTOR_CONTRIBUTIONS = ["Financement", "Plantation", "Irrigation", "Équipements"] as const;

export const draftSchema = z.object({
  objective: z.enum(["sale", "rent", "partnership"]).nullish().transform((v) => v ?? null),
  name: str(120),

  title: z
    .object({
      answer: yesNoUnknown,
      number: str(60),
      registry: str(120),
      ownerNames: str(300),
      ownership: z.enum(["individual", "joint", "other"]).nullish().transform((v) => v ?? null),
      jointOwnersAgree: bool,
      altDocument: z
        .enum(["adoulaire", "sale_contract", "ownership_certificate", "other", "none"])
        .nullish()
        .transform((v) => v ?? null),
      registrationInProgress: yesNoUnknown,
    })
    .prefault({}),

  water: z
    .object({
      answer: z.enum(["yes", "no"]).nullish().transform((v) => v ?? null),
      sources: z.array(z.enum(["well", "borehole", "network", "cistern", "other"])).max(5).default([]),
      availability: z.enum(["year_round", "seasonal", "uncertain"]).nullish().transform((v) => v ?? null),
      flowValue: num(0, 100000),
      flowUnit: z.enum(["l_s", "m3_h"]).nullish().transform((v) => v ?? "l_s"),
      flowMeasured: bool, // « mesuré » si méthode connue, sinon « déclaré »
      flowMethod: str(200),
      depthM: num(0, 2000),
      permit: str(200),
      salinityGL: num(0, 100),
      equipment: str(500),
      shared: yesNoUnknown,
      sharedDetails: str(1000),
      nearbySource: yesNoUnknown,
      nearbyType: str(120),
      nearbyDistanceKm: num(0, 500),
      rainfed: bool,
    })
    .prefault({}),

  location: z
    .object({
      governorateId: str(40),
      delegationId: str(80),
      lat: num(30, 38),
      lng: num(7, 12),
      areaHa: num(0, 1e6),
      exploitableAreaHa: num(0, 1e6),
    })
    .prefault({}),

  land: z
    .object({
      state: z.enum(["exploited", "partial", "abandoned"]).nullish().transform((v) => v ?? null),
      trees: z
        .array(z.object({ species: z.string().trim().max(60), count: num(0, 1e6), age: str(40) }))
        .max(20)
        .default([]),
      buildings: str(1000),
      crops: str(300),
      description: str(3000),
      soilType: str(40),
      soilAnalyses: str(1000),
      equipment: list(),
      practices: list(),
      treesValueTnd: num(0, 1e10),
      buildingsValueTnd: num(0, 1e10),
      worksTnd: num(0, 1e10),
      currentOperation: str(1000),
      localKnowledge: str(1000),
      localJobs: num(0, 10000),
    })
    .prefault({}),

  offer: z
    .object({
      // A. Vente
      priceTnd: num(0, 1e11),
      negotiable: yesNoUnknown,
      partialSale: bool,
      included: list(),
      visitAvailability: str(300),
      // B. Location
      rentTnd: num(0, 1e10),
      rentPeriod: z.enum(["annuel", "mensuel", "autre"]).nullish().transform((v) => v ?? "annuel"),
      minDurationYears: num(0, 99),
      proposedDurationYears: num(0, 99),
      paymentTerms: str(300),
      allowPlanting: bool,
      allowBuilding: bool,
      irrigationTerms: str(500),
      renewable: bool,
      // C. Partenariat
      partnershipType: z.enum(["mgharsa", "other"]).nullish().transform((v) => v ?? null),
      projectDescription: str(2000),
      ownerContribution: list(),
      investorContribution: list(),
      ownerParticipates: bool,
      ownerExperience: str(1000),
      ownerSharePct: num(0, 100),
      durationYears: num(0, 99),
      notes: str(2000),
    })
    .prefault({}),
});

export type LandDraft = z.output<typeof draftSchema>;
export type LandDraftInput = z.input<typeof draftSchema>;

export function emptyDraft(objective: LandDraft["objective"] = null): LandDraft {
  return draftSchema.parse({ objective });
}

/** Compteurs issus des tables photos / documents (étape 5). */
export interface DraftMedia {
  photoCount: number;
  documentsCount: number;
  hasTitleUpload: boolean;
  hasWaterAnalysis: boolean;
}

export const NO_MEDIA: DraftMedia = { photoCount: 0, documentsCount: 0, hasTitleUpload: false, hasWaterAnalysis: false };

/** Les conditions principales de l'offre sont-elles renseignées ? */
export function offerComplete(d: LandDraft): boolean {
  const o = d.offer;
  if (d.objective === "sale") return o.priceTnd != null && o.negotiable != null;
  if (d.objective === "rent") return o.rentTnd != null && o.minDurationYears != null;
  if (d.objective === "partnership")
    return o.partnershipType != null && o.ownerContribution.length > 0 && o.investorContribution.length > 0;
  return false;
}

/** Entrée du moteur de classement (§5) : utilisée pour la jauge en direct et côté serveur. */
export function toRankingInput(d: LandDraft, media: DraftMedia = NO_MEDIA): LandForRanking {
  const w = d.water;
  return {
    essentials: {
      objective: d.objective,
      governorate: d.location.governorateId,
      delegation: d.location.delegationId,
      lat: d.location.lat,
      lng: d.location.lng,
      areaHa: d.location.areaHa,
      photoCount: media.photoCount,
    },
    title: { ...d.title, hasUpload: media.hasTitleUpload },
    water: {
      answer: w.answer,
      sources: w.sources,
      availability: w.availability,
      flow: w.flowValue != null ? { value: w.flowValue, unit: w.flowUnit, nature: w.flowMeasured ? "measured" : "declared", method: w.flowMethod } : null,
      depthM: w.depthM,
      salinityGL: w.salinityGL != null ? { value: w.salinityGL, nature: "declared" } : null,
      shared: w.shared,
      sharedDetails: w.sharedDetails,
      nearbySource: w.nearbySource,
      nearbyDistanceKm: w.nearbyDistanceKm,
      rainfed: w.rainfed,
      hasAnalysisUpload: media.hasWaterAnalysis,
    },
    extras: {
      exploitableAreaHa: d.location.exploitableAreaHa != null,
      state: d.land.state != null,
      trees: d.land.trees.length > 0,
      offerDetails: offerComplete(d),
      documentsCount: media.documentsCount,
    },
  };
}

/** Lignes SQL (tables lands, land_titles, land_water, land_offers). */
export function toRows(d: LandDraft) {
  const w = d.water;
  const o = d.offer;
  return {
    land: {
      objective: d.objective,
      title: d.name,
      description: d.land.description,
      governorate_id: d.location.governorateId,
      delegation_id: d.location.delegationId,
      lat: d.location.lat,
      lng: d.location.lng,
      area_ha: d.location.areaHa,
      exploitable_area_ha: d.location.exploitableAreaHa,
      state: d.land.state,
      trees: d.land.trees,
      buildings: d.land.buildings,
      crops: d.land.crops,
      practices: d.land.practices,
      soil: {
        soilType: d.land.soilType,
        soilAnalyses: d.land.soilAnalyses,
        equipment: d.land.equipment,
        treesValueTnd: d.land.treesValueTnd,
        buildingsValueTnd: d.land.buildingsValueTnd,
        worksTnd: d.land.worksTnd,
        currentOperation: d.land.currentOperation,
        localKnowledge: d.land.localKnowledge,
        localJobs: d.land.localJobs,
      },
    },
    title: {
      answer: d.title.answer,
      number: d.title.number,
      registry: d.title.registry,
      owner_names: d.title.ownerNames,
      ownership: d.title.ownership,
      joint_owners_agree: d.title.jointOwnersAgree,
      alt_document: d.title.altDocument,
      registration_in_progress: d.title.registrationInProgress,
    },
    water: {
      answer: w.answer,
      sources: w.sources,
      availability: w.availability,
      flow_value: w.flowValue,
      flow_unit: w.flowValue != null ? w.flowUnit : null,
      flow_nature: w.flowValue != null ? (w.flowMeasured ? "measured" : "declared") : null,
      flow_method: w.flowMethod,
      depth_m: w.depthM,
      permit: w.permit,
      salinity_g_l: w.salinityGL,
      salinity_nature: w.salinityGL != null ? "declared" : null,
      equipment: w.equipment,
      shared: w.shared,
      shared_details: w.sharedDetails,
      nearby_source: w.nearbySource,
      nearby_type: w.nearbyType,
      nearby_distance_km: w.nearbyDistanceKm,
      rainfed: w.rainfed,
    },
    offer: {
      price_tnd: o.priceTnd,
      negotiable: o.negotiable,
      partial_sale: o.partialSale,
      included: o.included,
      rent_tnd: o.rentTnd,
      rent_period: o.rentTnd != null ? o.rentPeriod : null,
      min_duration_years: o.minDurationYears,
      partnership_type: o.partnershipType,
      owner_contribution: o.ownerContribution,
      investor_contribution: o.investorContribution,
      owner_share_pct: o.ownerSharePct,
      // Champs sans colonne dédiée : conservés dans details
      details: {
        visitAvailability: o.visitAvailability,
        proposedDurationYears: o.proposedDurationYears,
        paymentTerms: o.paymentTerms,
        allowPlanting: o.allowPlanting,
        allowBuilding: o.allowBuilding,
        irrigationTerms: o.irrigationTerms,
        renewable: o.renewable,
        projectDescription: o.projectDescription,
        ownerParticipates: o.ownerParticipates,
        ownerExperience: o.ownerExperience,
        durationYears: o.durationYears,
        notes: o.notes,
      },
    },
  };
}

type Row = Record<string, unknown> | null | undefined;
const n = (v: unknown) => (v == null ? null : Number(v));

/** Reconstitue le brouillon depuis la base (reprise sur n'importe quel appareil, TER-05). */
export function fromRows(land: Row, title: Row, water: Row, offer: Row): LandDraft {
  const l = land ?? {};
  const t = title ?? {};
  const w = water ?? {};
  const o = offer ?? {};
  const det = (o.details ?? {}) as Record<string, unknown>;
  return draftSchema.parse({
    objective: l.objective,
    name: l.title,
    title: {
      answer: t.answer,
      number: t.number,
      registry: t.registry,
      ownerNames: t.owner_names,
      ownership: t.ownership,
      jointOwnersAgree: t.joint_owners_agree,
      altDocument: t.alt_document,
      registrationInProgress: t.registration_in_progress,
    },
    water: {
      answer: w.answer,
      sources: w.sources ?? [],
      availability: w.availability,
      flowValue: n(w.flow_value),
      flowUnit: w.flow_unit,
      flowMeasured: w.flow_nature == null ? null : w.flow_nature === "measured",
      flowMethod: w.flow_method,
      depthM: n(w.depth_m),
      permit: w.permit,
      salinityGL: n(w.salinity_g_l),
      equipment: w.equipment,
      shared: w.shared,
      sharedDetails: w.shared_details,
      nearbySource: w.nearby_source,
      nearbyType: w.nearby_type,
      nearbyDistanceKm: n(w.nearby_distance_km),
      rainfed: w.rainfed,
    },
    location: {
      governorateId: l.governorate_id,
      delegationId: l.delegation_id,
      lat: n(l.lat),
      lng: n(l.lng),
      areaHa: n(l.area_ha),
      exploitableAreaHa: n(l.exploitable_area_ha),
    },
    land: {
      state: l.state,
      trees: ((l.trees as unknown[]) ?? []).map((tr) => {
        const x = tr as Record<string, unknown>;
        return { species: String(x.species ?? ""), count: n(x.count), age: (x.age as string) ?? null };
      }),
      buildings: l.buildings,
      crops: l.crops,
      description: l.description,
      practices: (l.practices as string[]) ?? [],
      ...Object.fromEntries(Object.entries((l.soil as Record<string, unknown>) ?? {}).filter(([, v]) => v != null)),
    },
    offer: {
      priceTnd: n(o.price_tnd),
      negotiable: o.negotiable,
      partialSale: o.partial_sale,
      included: o.included ?? [],
      rentTnd: n(o.rent_tnd),
      rentPeriod: o.rent_period ?? "annuel",
      minDurationYears: n(o.min_duration_years),
      partnershipType: o.partnership_type,
      ownerContribution: o.owner_contribution ?? [],
      investorContribution: o.investor_contribution ?? [],
      ownerSharePct: n(o.owner_share_pct),
      ...Object.fromEntries(Object.entries(det).filter(([, v]) => v != null)),
    },
  });
}
