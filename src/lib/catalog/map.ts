import { DEMO_LANDS } from "@/lib/data/demo-lands";
import { delegationId } from "@/lib/data/tunisia";
import type { CatalogItem } from "./types";

type Row = Record<string, unknown>;
const n = (v: unknown) => (v == null ? null : Number(v));
const s = (v: unknown) => (v == null ? null : String(v));

export function toLs(value: number | null, unit: string | null): number | null {
  if (value == null) return null;
  return unit === "m3_h" ? Math.round((value / 3.6) * 100) / 100 : value;
}

/** Teinte stable par terrain pour le visuel de remplacement. */
function hueOf(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 60;
  return h - 20;
}

/** Ligne de la vue catalog_lands → CatalogItem. */
export function rowToItem(r: Row, photoUrls: string[] = []): CatalogItem {
  const flowValue = n(r.flow_value);
  const flowUnit = s(r.flow_unit) as CatalogItem["flowUnit"];
  return {
    id: String(r.id),
    ref: String(r.ref),
    name: s(r.title) ?? String(r.ref),
    description: s(r.description),
    objective: r.objective as CatalogItem["objective"],
    governorateId: s(r.governorate_id),
    governorate: s(r.governorate_name),
    delegationId: s(r.delegation_id),
    delegation: s(r.delegation_name),
    latApprox: n(r.lat_approx),
    lngApprox: n(r.lng_approx),
    areaHa: n(r.area_ha),
    exploitableAreaHa: n(r.exploitable_area_ha),
    state: (r.state ?? null) as CatalogItem["state"],
    crops: s(r.crops),
    trees: ((r.trees as Row[] | null) ?? []).map((t) => ({ species: String(t.species ?? ""), count: n(t.count), age: s(t.age) })),
    buildings: s(r.buildings),
    practices: (r.practices as string[] | null) ?? [],
    extra: (r.soil as CatalogItem["extra"] | null) ?? {},
    rankingStatus: r.ranking_status as CatalogItem["rankingStatus"],
    rankingReason: String(r.ranking_reason ?? ""),
    titleProof: r.title_proof as CatalogItem["titleProof"],
    titleAnswer: (r.title_answer ?? null) as CatalogItem["titleAnswer"],
    ownership: (r.ownership ?? null) as CatalogItem["ownership"],
    jointOwnersAgree: (r.joint_owners_agree ?? null) as boolean | null,
    altDocument: s(r.alt_document),
    titleVerifiedAt: s(r.title_verified_at),
    titleReview: Boolean(r.title_review),
    titleNotes: s(r.title_notes),
    waterProof: r.water_proof as CatalogItem["waterProof"],
    waterAnswer: (r.water_answer ?? null) as CatalogItem["waterAnswer"],
    waterSources: ((r.water_sources as string[] | null) ?? []) as CatalogItem["waterSources"],
    waterAvailability: (r.water_availability ?? null) as CatalogItem["waterAvailability"],
    flowLs: toLs(flowValue, flowUnit),
    flowValue,
    flowUnit,
    flowNature: s(r.flow_nature),
    depthM: n(r.depth_m),
    salinityGL: n(r.salinity_g_l),
    waterEquipment: s(r.water_equipment),
    waterShared: (r.water_shared ?? null) as CatalogItem["waterShared"],
    waterSharedDetails: s(r.water_shared_details),
    nearbySource: (r.nearby_source ?? null) as CatalogItem["nearbySource"],
    nearbyDistanceKm: n(r.nearby_distance_km),
    priceTnd: n(r.price_tnd),
    negotiable: (r.negotiable ?? null) as CatalogItem["negotiable"],
    partialSale: (r.partial_sale ?? null) as boolean | null,
    included: (r.included as string[] | null) ?? [],
    rentTnd: n(r.rent_tnd),
    rentPeriod: s(r.rent_period),
    minDurationYears: n(r.min_duration_years),
    partnershipType: (r.partnership_type ?? null) as CatalogItem["partnershipType"],
    ownerContribution: (r.owner_contribution as string[] | null) ?? [],
    investorContribution: (r.investor_contribution as string[] | null) ?? [],
    ownerSharePct: n(r.owner_share_pct),
    feeNote: s(r.verdolive_fee_note),
    offerDetails: (r.offer_details as Record<string, unknown> | null) ?? {},
    scoreLegal: Number(r.score_legal ?? 0),
    scoreWater: Number(r.score_water ?? 0),
    scoreCompleteness: Number(r.score_completeness ?? 0),
    scoreAgri: n(r.score_agri),
    documentsCount: Number(r.documents_count ?? 0),
    photoUrls,
    publishedAt: s(r.published_at),
    hue: hueOf(String(r.id)),
  };
}

/** Terrains de démonstration, quand Supabase n'est pas configuré. */
export function demoItems(): CatalogItem[] {
  return DEMO_LANDS.map((l) =>
    rowToItem({
      id: l.id,
      ref: l.ref,
      title: l.name,
      objective: l.objective,
      governorate_id: l.governorateId,
      governorate_name: l.governorate,
      delegation_id: delegationId(l.governorateId, l.delegation),
      delegation_name: l.delegation,
      lat_approx: Math.round(l.lat * 100) / 100,
      lng_approx: Math.round(l.lng * 100) / 100,
      area_ha: l.areaHa,
      crops: l.crops,
      trees: l.crops.match(/olivi|amand|palmier/i) ? [{ species: l.crops.split(/[ ,]/)[0], count: null, age: null }] : [],
      ranking_status: l.ranking.status,
      ranking_reason: l.ranking.reason,
      title_proof: l.ranking.titleProof,
      title_answer: l.title.answer,
      ownership: l.title.ownership,
      joint_owners_agree: l.title.jointOwnersAgree,
      water_proof: l.ranking.waterProof,
      water_answer: l.water.answer,
      water_sources: l.water.sources,
      water_availability: l.water.availability,
      flow_value: l.water.flow?.value,
      flow_unit: l.water.flow?.unit,
      flow_nature: l.water.flow?.nature,
      water_shared: l.water.shared,
      water_shared_details: l.water.sharedDetails,
      nearby_source: l.water.nearbySource,
      nearby_distance_km: l.water.nearbyDistanceKm,
      rainfed: l.water.rainfed,
      price_tnd: l.priceTnd,
      rent_tnd: l.rentTnd,
      rent_period: l.rentTnd ? "annuel" : null,
      partnership_type: l.objective === "partnership" ? "mgharsa" : null,
      owner_contribution: l.objective === "partnership" ? ["Mise à disposition du terrain", "Suivi local"] : [],
      investor_contribution: l.objective === "partnership" ? ["Financement", "Plantation"] : [],
      owner_share_pct: l.ownerSharePct,
      score_legal: l.ranking.scores.legal,
      score_water: l.ranking.scores.water,
      score_completeness: l.ranking.scores.completeness,
      documents_count: l.extras?.documentsCount ?? 0,
      published_at: l.publishedAt,
    }),
  ).map((item, i) => ({ ...item, hue: DEMO_LANDS[i].hue }));
}
