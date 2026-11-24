import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Lien invalide" };

const MESSAGES: Record<string, { title: string; text: string }> = {
  expire: { title: "Ce lien a expiré", text: "Les liens reçus par e-mail sont valables une heure et ne servent qu'une fois. Demandez-en un nouveau." },
  lien: { title: "Ce lien n'est pas valide", text: "Il a peut-être déjà été utilisé, ou il a été copié de façon incomplète." },
  google: { title: "Connexion Google impossible", text: "La connexion avec Google a été annulée ou a échoué. Réessayez, ou utilisez votre adresse e-mail." },
  config: { title: "Connexion indisponible", text: "Le service d'authentification n'est pas encore configuré." },
};

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<{ raison?: string }> }) {
  const m = MESSAGES[(await searchParams).raison ?? ""] ?? MESSAGES.lien;
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <AlertTriangle className="size-10 text-warning-600" aria-hidden />
      <h1 className="mt-4 font-serif text-3xl font-semibold text-forest-900">{m.title}</h1>
      <p className="mt-3 text-ink-600">{m.text}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/connexion">Se connecter</ButtonLink>
        <ButtonLink href="/" variant="outline">Accueil</ButtonLink>
      </div>
    </div>
  );
}
