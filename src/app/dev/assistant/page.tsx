import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandWizard } from "@/components/wizard/land-wizard";

export const metadata: Metadata = { title: "Assistant (prévisualisation)", robots: { index: false } };

/** Prévisualisation de l'assistant sans base de données. Indisponible en production. */
export default function WizardPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <LandWizard mode="demo" />;
}
