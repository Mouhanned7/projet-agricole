import { Menu, X } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";

const NAV = [
  { href: "/#catalogue", label: "Terrains" },
  { href: "/#porteurs", label: "Porteurs de terrain" },
  { href: "/#impact", label: "Notre impact" },
  { href: "/#fonctionnement", label: "Comment ça marche" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-forest-950/95 backdrop-blur supports-[backdrop-filter]:bg-forest-950/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="VerdOlive, accueil">
          <Logo light />
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-7 lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm text-cream-100/85 transition-colors hover:text-gold-400">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <ButtonLink href="/connexion" variant="ghost" size="sm" className="text-cream-100 hover:bg-cream-50/10">
            Se connecter
          </ButtonLink>
          <ButtonLink href="/inscription" variant="gold" size="sm">
            Créer un compte
          </ButtonLink>
        </div>

        {/* Menu mobile sans JavaScript */}
        <details className="group relative sm:hidden">
          <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-full text-cream-50 hover:bg-cream-50/10 [&::-webkit-details-marker]:hidden">
            <Menu className="size-5 group-open:hidden" aria-hidden />
            <X className="hidden size-5 group-open:block" aria-hidden />
            <span className="sr-only">Menu</span>
          </summary>
          <div className="fixed inset-x-0 top-16 border-t border-cream-50/10 bg-forest-950 px-4 pb-6 pt-2">
            <nav aria-label="Navigation mobile" className="flex flex-col">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="border-b border-cream-50/10 py-3.5 text-cream-100">
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <ButtonLink href="/connexion" variant="outlineLight">Se connecter</ButtonLink>
              <ButtonLink href="/inscription" variant="gold">Créer un compte</ButtonLink>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
