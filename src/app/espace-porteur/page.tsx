import { FileText, Plus } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Mon espace porteur" };

/** INS-08 : destination du porteur de terrain. L'assistant arrive au Sprint 2. */
export default async function OwnerSpacePage() {
  const session = await getSession();
  if (!session?.profile) redirect("/connexion?next=/espace-porteur");
  const firstName = session.profile.full_name.split(" ")[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Bonjour {firstName}</h1>
      <p className="mt-2 text-ink-600">Présentez votre terrain pour le vendre, le louer ou trouver un partenaire.</p>

      <div className="mt-8 rounded-card border-2 border-dashed border-forest-900/15 bg-white p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-olive-100 text-forest-800">
          <Plus className="size-7" aria-hidden />
        </span>
        <h2 className="mt-4 text-xl font-semibold text-ink-900">Ajouter mon terrain</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
          7 étapes guidées, enregistrées automatiquement. Les deux questions essentielles : le titre foncier et l&apos;eau.
        </p>
        <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-cream-200 px-4 py-2 text-sm text-ink-600">
          <FileText className="size-4" aria-hidden /> Assistant disponible au prochain lot (Sprint 2)
        </p>
      </div>
    </div>
  );
}
