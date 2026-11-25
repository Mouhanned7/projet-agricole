import { CheckCircle2, LandPlot, LogOut, MailWarning, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/account/profile-form";
import { Button } from "@/components/ui/button";
import { addRole, signOut } from "@/lib/auth/actions";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Mon compte" };

const ROLE_INFO = {
  investor: { label: "Investisseur", icon: Search, href: "/catalogue", cta: "Voir le catalogue", add: "Je veux aussi investir" },
  owner: { label: "Porteur de terrain", icon: LandPlot, href: "/espace-porteur", cta: "Mon espace porteur", add: "Je veux aussi proposer un terrain" },
} as const;

export default async function AccountPage() {
  const session = await getSession();
  if (!session?.profile) redirect("/connexion?next=/compte");
  const { profile, email } = session;
  const roles = profile.roles.filter((r): r is "investor" | "owner" => r !== "admin");
  const missing = (["investor", "owner"] as const).filter((r) => !roles.includes(r));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Mon compte</h1>

      <section className="mt-8 rounded-card bg-white p-6 ring-1 ring-forest-900/10" aria-labelledby="acces">
        <h2 id="acces" className="font-semibold text-ink-900">Connexion</h2>
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink-600">
          {email}
          {profile.email_verified_at ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-olive-100 px-2.5 py-0.5 text-xs font-medium text-forest-800">
              <CheckCircle2 className="size-3.5" aria-hidden /> Adresse confirmée
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-medium text-gold-600">
              <MailWarning className="size-3.5" aria-hidden /> À confirmer
            </span>
          )}
        </p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {[
            ["/compte/notifications", "Notifications"],
            ["/compte/favoris", "Mes favoris"],
            ["/compte/recherches", "Mes recherches"],
            ["/compte/visites", "Mes demandes de visite"],
            ...(roles.includes("owner") ? [["/espace-porteur/visites", "Visites reçues"]] : []),
            ["/compte/nouveau-mot-de-passe", "Changer de mot de passe"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="font-medium text-forest-800 underline underline-offset-2">
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-card bg-white p-6 ring-1 ring-forest-900/10" aria-labelledby="profils">
        <h2 id="profils" className="font-semibold text-ink-900">Mes profils</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {roles.map((r) => {
            const { label, icon: Icon, href, cta } = ROLE_INFO[r];
            return (
              <li key={r} className="flex items-center gap-3 rounded-xl bg-olive-100/60 p-4">
                <Icon className="size-6 text-forest-800" aria-hidden />
                <div className="flex-1">
                  <p className="font-medium text-ink-900">{label}</p>
                  <Link href={href} className="text-sm text-forest-800 underline underline-offset-2">
                    {cta}
                  </Link>
                </div>
              </li>
            );
          })}
          {missing.map((r) => (
            <li key={r}>
              <form action={addRole} className="h-full">
                <input type="hidden" name="role" value={r} />
                <button
                  type="submit"
                  className="flex h-full w-full items-center gap-3 rounded-xl border-2 border-dashed border-forest-900/20 p-4 text-left text-sm font-medium text-forest-800 hover:border-gold-500"
                >
                  + {ROLE_INFO[r].add}
                </button>
              </form>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-400">Un même compte peut être investisseur et porteur de terrain.</p>
      </section>

      <section className="mt-6 rounded-card bg-white p-6 ring-1 ring-forest-900/10" aria-labelledby="infos">
        <h2 id="infos" className="font-semibold text-ink-900">Mes informations</h2>
        <p className="mt-1 text-sm text-ink-600">Facultatif : complétez-les quand vous le souhaitez.</p>
        <div className="mt-5">
          <ProfileForm profile={profile} />
        </div>
      </section>

      <form action={signOut} className="mt-8">
        <Button type="submit" variant="ghost">
          <LogOut className="size-4" aria-hidden /> Se déconnecter
        </Button>
      </form>
    </div>
  );
}
