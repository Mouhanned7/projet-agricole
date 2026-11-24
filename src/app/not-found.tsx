import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <p className="font-serif text-6xl font-semibold text-gold-500">404</p>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-forest-900">Page introuvable</h1>
      <p className="mt-3 text-ink-600">Cette page n&apos;existe pas, ou ce terrain n&apos;est plus publié.</p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/catalogue">Voir les terrains</ButtonLink>
        <ButtonLink href="/" variant="outline">Accueil</ButtonLink>
      </div>
    </div>
  );
}
