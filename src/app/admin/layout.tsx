import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

const NAV = [
  ["/admin", "Tableau de bord"],
  ["/admin/terrains", "Terrains"],
  ["/admin/signalements", "Signalements"],
  ["/admin/reglages", "Réglages"],
] as const;

/** Espace administrateur (§9) : réservé au rôle admin. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/admin");
  if (!session.profile?.roles.includes("admin")) notFound();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav aria-label="Administration" className="mb-8 flex gap-1 overflow-x-auto rounded-full bg-white p-1 ring-1 ring-forest-900/10 sm:inline-flex">
        {NAV.map(([href, label]) => (
          <Link key={href} href={href} className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-ink-600 hover:bg-forest-900/5 hover:text-forest-900">
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
