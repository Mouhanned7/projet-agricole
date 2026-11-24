import type { RankingResult } from "@/lib/domain/types";
import type { DraftMedia, LandDraft } from "@/lib/lands/draft";

export type Section = "title" | "water" | "location" | "land" | "offer";

export interface StepProps {
  draft: LandDraft;
  /** Met à jour une section du brouillon. */
  patch: <K extends Section>(section: K, p: Partial<LandDraft[K]>) => void;
  setRoot: (p: Partial<Pick<LandDraft, "objective" | "name">>) => void;
  /** Affiche les erreurs de l'étape (après un clic sur « Suivant »). */
  showErrors: boolean;
  ranking: RankingResult;
  media: DraftMedia;
  setMedia: (m: DraftMedia) => void;
  landId: string | null;
  /** « demo » : aucune écriture en base (prévisualisation en développement). */
  mode: "live" | "demo";
  goTo: (step: number) => void;
  /** Enregistre le brouillon et renvoie son identifiant (création à la première étape). */
  ensureSaved: () => Promise<string | null>;
}
