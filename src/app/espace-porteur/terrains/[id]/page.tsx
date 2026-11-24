import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LandWizard } from "@/components/wizard/land-wizard";
import { getSession } from "@/lib/auth/session";
import { EDITABLE_STATUSES, WORKFLOW_LABEL } from "@/lib/lands/labels";
import { getDraft } from "@/lib/lands/queries";

export const metadata: Metadata = { title: "Mon terrain" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Reprise du brouillon à la dernière étape enregistrée (TER-05, scénario 7). */
export default async function EditLandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/connexion?next=/espace-porteur/terrains/${id}`);
  if (!UUID.test(id)) notFound();
  const loaded = await getDraft(id);
  if (!loaded) notFound();

  if (!EDITABLE_STATUSES.includes(loaded.status)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <p className="text-sm text-ink-400">{loaded.ref}</p>
        <h1 className="mt-1 font-serif text-4xl font-semibold text-forest-900">{loaded.draft.name ?? "Mon terrain"}</h1>
        <p className="mt-4 rounded-xl bg-olive-100 px-4 py-3 text-forest-900">
          Statut : <strong>{WORKFLOW_LABEL[loaded.status]}</strong>. Le dossier est en cours de traitement par l&apos;équipe VerdOlive ;
          vous serez prévenu à chaque étape.
        </p>
        <Link href="/espace-porteur" className="mt-6 inline-block font-medium text-forest-800 underline underline-offset-2">
          Retour à mon espace
        </Link>
      </div>
    );
  }

  return (
    <LandWizard
      mode="live"
      landId={loaded.id}
      landRef={loaded.ref}
      initialDraft={loaded.draft}
      initialStep={loaded.step}
      initialMedia={loaded.media}
    />
  );
}
