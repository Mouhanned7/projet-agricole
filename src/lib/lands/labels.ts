import type { LandWorkflowStatus } from "@/lib/domain/types";

/** §10 : libellés des statuts de traitement, côté porteur. */
export const WORKFLOW_LABEL: Record<LandWorkflowStatus, string> = {
  draft: "Brouillon",
  submitted: "Soumis",
  info_requested: "Informations à compléter",
  title_review: "Vérification foncière",
  agri_analysis: "Analyse agricole",
  economic_review: "Diagnostic économique",
  validation: "Validation",
  published: "Publié",
  matching: "Mise en relation",
  negotiation: "Négociation",
  closed: "Clôturé",
  suspended: "Suspendu",
  rejected: "Refusé",
};

export const EDITABLE_STATUSES: LandWorkflowStatus[] = ["draft", "info_requested"];

export const OBJECTIVE_LABEL = { sale: "Vente", rent: "Location", partnership: "Partenariat" } as const;
