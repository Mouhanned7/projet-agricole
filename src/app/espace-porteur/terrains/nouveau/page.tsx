import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LandWizard } from "@/components/wizard/land-wizard";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Ajouter mon terrain" };

export default async function NewLandPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/espace-porteur/terrains/nouveau");
  return <LandWizard mode="live" />;
}
