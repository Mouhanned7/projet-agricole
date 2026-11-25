import type {
  Objective,
  RankingStatus,
  TitleAnswer,
  TitleProof,
  WaterAnswer,
  WaterAvailability,
  WaterProof,
  WaterSource,
} from "@/lib/domain/types";

/** Un terrain publié, tel que l'affichent le catalogue, la carte et la fiche. */
export interface CatalogItem {
  id: string;
  ref: string;
  name: string;
  description: string | null;
  objective: Objective;
  governorateId: string | null;
  governorate: string | null;
  delegationId: string | null;
  delegation: string | null;
  latApprox: number | null;
  lngApprox: number | null;
  areaHa: number | null;
  exploitableAreaHa: number | null;
  state: "exploited" | "partial" | "abandoned" | null;
  crops: string | null;
  trees: { species: string; count: number | null; age: string | null }[];
  buildings: string | null;
  practices: string[];
  /** Sol, équipements, valeurs, savoir-faire (colonne soil). */
  extra: {
    soilType?: string | null;
    soilAnalyses?: string | null;
    equipment?: string[];
    treesValueTnd?: number | null;
    buildingsValueTnd?: number | null;
    worksTnd?: number | null;
    currentOperation?: string | null;
    localKnowledge?: string | null;
    localJobs?: number | null;
  };
  rankingStatus: RankingStatus;
  rankingReason: string;
  titleProof: TitleProof;
  titleAnswer: TitleAnswer | null;
  ownership: "individual" | "joint" | "other" | null;
  jointOwnersAgree: boolean | null;
  altDocument: string | null;
  titleVerifiedAt: string | null;
  titleReview: boolean;
  titleNotes: string | null;
  waterProof: WaterProof;
  waterAnswer: WaterAnswer | null;
  waterSources: WaterSource[];
  waterAvailability: WaterAvailability | null;
  /** Débit converti en l/s pour comparer (null si non renseigné). */
  flowLs: number | null;
  flowValue: number | null;
  flowUnit: "l_s" | "m3_h" | null;
  flowNature: string | null;
  depthM: number | null;
  salinityGL: number | null;
  waterEquipment: string | null;
  waterShared: "yes" | "no" | "unknown" | null;
  waterSharedDetails: string | null;
  nearbySource: "yes" | "no" | "unknown" | null;
  nearbyDistanceKm: number | null;
  priceTnd: number | null;
  negotiable: "yes" | "no" | "unknown" | null;
  partialSale: boolean | null;
  included: string[];
  rentTnd: number | null;
  rentPeriod: string | null;
  minDurationYears: number | null;
  partnershipType: "mgharsa" | "other" | null;
  ownerContribution: string[];
  investorContribution: string[];
  ownerSharePct: number | null;
  feeNote: string | null;
  offerDetails: Record<string, unknown>;
  scoreLegal: number;
  scoreWater: number;
  scoreCompleteness: number;
  scoreAgri: number | null;
  documentsCount: number;
  photoUrls: string[];
  publishedAt: string | null;
  /** Visuel de remplacement tant qu'il n'y a pas de photo. */
  hue: number;
}
