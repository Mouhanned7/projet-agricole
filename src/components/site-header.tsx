import { Bell, Menu, UserRound, X } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { MobileMenu } from "@/components/mobile-menu";
import { ButtonLink } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { getSession } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { homeForRoles } from "@/lib/validation/auth";

const NAV = [
  { href: "/catalogue", label: "Terrains" },
  { href: "/carte", label: "Carte" },
  { href: "/#porteurs", label: "Porteurs de terrain" },
  { href: "/#impact", label: "Notre impact" },
  { href: "/#fonctionnement", label: "Comment ça marche" },
];

export async function SiteHeader() {
  const session = await getSession();
  const locale = await getLocale();
  const firstName = session?.profile?.full_name.split(" ")[0];
  const space = session ? homeForRoles(session.profile?.roles ?? []) : null;
  let unread = 0;
  if (session) {
    const supabase = await createClient();
    const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", session.userId).is("read_at", null);
    unread = count ?? 0;
  }
  const spaceLabel = space === "/espace-porteur" ? "Mon espace porteur" : space === "/admin" ? "Administration" : "Catalogue";

  return (
    <header className="sticky top-0 z-40 border-b border-forest-900/10 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="VerdOlive, accueil">
          <Logo />
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-6 xl:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap text-sm font-medium text-ink-600 transition-colors hover:text-forest-800">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 xl:flex">
          <LanguageSwitcher locale={locale} />
          {session ? (
            <>
              <ButtonLink href={space!} variant="ghost" size="sm">
                {spaceLabel}
              </ButtonLink>
              <Link href="/compte/notifications" className="relative grid size-9 place-items-center rounded-full text-forest-900 hover:bg-forest-900/5" aria-label={`Notifications${unread ? ` (${unread} non lues)` : ""}`}>
                <Bell className="size-5" aria-hidden />
                {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-gold-500 px-1 text-[11px] font-bold text-forest-950">{unread > 9 ? "9+" : unread}</span>}
              </Link>
              <ButtonLink href="/compte" variant="forest" size="sm">
                <UserRound className="size-4" aria-hidden /> {firstName ?? "Mon compte"}
              </ButtonLink>
            </>
          ) : (
            <>
              <ButtonLink href="/connexion" variant="ghost" size="sm">
                Se connecter
              </ButtonLink>
              <ButtonLink href="/inscription" variant="forest" size="sm">
                Créer un compte
              </ButtonLink>
            </>
          )}
        </div>

        {/* Menu mobile sans JavaScript */}
        <LanguageSwitcher locale={locale} className="ms-auto xl:hidden" />

        <MobileMenu>
          <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-full text-forest-900 hover:bg-forest-900/5 [&::-webkit-details-marker]:hidden">
            <Menu className="size-5 group-open:hidden" aria-hidden />
            <X className="hidden size-5 group-open:block" aria-hidden />
            <span className="sr-only">Menu</span>
          </summary>
          <div className="fixed inset-x-0 top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-t border-forest-900/10 bg-white px-4 pb-6 pt-2 shadow-lg sm:px-6">
            <nav aria-label="Navigation mobile" className="flex flex-col">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="border-b border-forest-900/10 py-3.5 font-medium text-ink-900">
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {session ? (
                <>
                  <ButtonLink href={space!} variant="outline">{spaceLabel}</ButtonLink>
                  <ButtonLink href="/compte" variant="forest">Mon compte</ButtonLink>
                </>
              ) : (
                <>
                  <ButtonLink href="/connexion" variant="outline">Se connecter</ButtonLink>
                  <ButtonLink href="/inscription" variant="forest">Créer un compte</ButtonLink>
                </>
              )}
            </div>
          </div>
        </MobileMenu>
      </div>
    </header>
  );
}
