/**
 * Modèle métier VerdOlive (cahier des charges v2).
 * Les noms de champs correspondent aux colonnes de supabase/migrations.
 */

export type Objective = "sale" | "rent" | "partnership";

/** §3.2 A : « Je ne sais pas » est traité comme non confirmé (décision D5). */
export type TitleAnswer = "yes" | "no" | "unknown";
export type WaterAnswer = "yes" | "no";
export type YesNoUnknown = "yes" | "no" | "unknown";

export type OwnershipKind = "individual" | "joint" | "other";
export type AltDocument = "adoulaire" | "sale_contract" | "ownership_certificate" | "other" | "none";
export type WaterSource = "well" | "borehole" | "network" | "cistern" | "other";
export type WaterAvailability = "year_round" | "seasonal" | "uncertain";
export type LandState = "exploited" | "partial" | "abandoned";

/** Nature d'une donnée (règle 8) : ne jamais mélanger. */
export type DataNature = "declared" | "measured" | "estimated" | "verified";

/** Preuve du titre (§5.2 rang 2). « verified » ne peut être posé que par l'admin (CLA-05). */
export type TitleProof = "none" | "declared" | "document" | "verified";
/** Preuve de l'eau (§5.2 rang 3, §5.4). « documented » et « analyzed » posés par l'admin. */
export type WaterProof = "none" | "declared" | "documented" | "analyzed";

export type RankingStatus = "priority" | "needs_check" | "low" | "incomplete";

/** §10 Workflow de traitement. */
export type LandWorkflowStatus =
  | "draft"
  | "submitted"
  | "info_requested"
  | "title_review"
  | "agri_analysis"
  | "economic_review"
  | "validation"
  | "published"
  | "matching"
  | "negotiation"
  | "closed"
  | "suspended"
  | "rejected";

export interface TitleInfo {
  answer: TitleAnswer | null;
  number?: string | null;
  registry?: string | null; // conservation foncière / gouvernorat de rattachement
  ownerNames?: string | null;
  ownership?: OwnershipKind | null;
  jointOwnersAgree?: boolean | null; // RES-02
  altDocument?: AltDocument | null; // si Non
  registrationInProgress?: YesNoUnknown | null; // si Non
  hasUpload?: boolean; // photo / PDF du titre ou du document
  proof?: TitleProof; // valeur posée par l'admin
}

export interface FlowValue {
  value: number;
  unit: "l_s" | "m3_h";
  nature: DataNature;
  method?: string | null;
}

export interface WaterInfo {
  answer: WaterAnswer | null;
  sources?: WaterSource[];
  availability?: WaterAvailability | null;
  flow?: FlowValue | null;
  depthM?: number | null;
  salinityGL?: { value: number; nature: DataNature } | null;
  shared?: YesNoUnknown | null; // RES-03
  sharedDetails?: string | null;
  nearbySource?: YesNoUnknown | null; // si Non
  nearbyDistanceKm?: number | null;
  rainfed?: boolean | null;
  hasAnalysisUpload?: boolean;
  proof?: WaterProof; // valeur posée par l'admin
}

export interface LandEssentials {
  objective: Objective | null;
  governorate?: string | null;
  delegation?: string | null;
  lat?: number | null;
  lng?: number | null;
  areaHa?: number | null;
  photoCount: number;
}

export interface LandForRanking {
  essentials: LandEssentials;
  title: TitleInfo;
  water: WaterInfo;
  agriScore?: number | null; // phase 2 (GeoAI)
  publishedAt?: string | null;
  /** Champs facultatifs comptés dans la complétude. */
  extras?: {
    exploitableAreaHa?: boolean;
    state?: boolean;
    trees?: boolean;
    soil?: boolean;
    offerDetails?: boolean;
    documentsCount?: number;
  };
}

export interface RankingResult {
  status: RankingStatus;
  /** Phrase courte affichée à l'écran (CLA-02). */
  reason: string;
  titleProof: TitleProof;
  waterProof: WaterProof;
  scores: {
    legal: number;
    water: number;
    completeness: number;
    agri: number | null;
  };
  /** Actions conseillées au porteur (jauge §3.1). */
  actions: string[];
  /** Le dossier peut-il être soumis (TER-01, TER-03, TER-04, RES-02) ? */
  canSubmit: boolean;
  blockingIssues: string[];
}
