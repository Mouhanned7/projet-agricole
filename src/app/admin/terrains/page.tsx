import type { Metadata } from "next";
import Link from "next/link";
import { AdminLandRow } from "@/components/admin/land-row";
import { getAdminLands } from "@/lib/admin/queries";
import { WORKFLOW_LABEL } from "@/lib/lands/labels";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Terrains · Administration" };

export default async function AdminLandsPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams;
  const valid = statut && statut in WORKFLOW_LABEL ? statut : null;
  const lands = await getAdminLands(valid ? [valid] : undefined);
  const statuses = Object.entries(WORKFLOW_LABEL).filter(([k]) => k !== "draft");
  return (
    <div>
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Terrains</h1>
      <nav className="mt-4 flex flex-wrap gap-2" aria-label="Filtrer par statut">
        <Link href="/admin/terrains" className={cn("rounded-full px-3 py-1.5 text-sm ring-1", !valid ? "bg-forest-900 text-cream-50 ring-forest-900" : "bg-white ring-forest-900/10")}>Tous</Link>
        {statuses.map(([k, label]) => (
          <Link key={k} href={`/admin/terrains?statut=${k}`} className={cn("rounded-full px-3 py-1.5 text-sm ring-1", valid === k ? "bg-forest-900 text-cream-50 ring-forest-900" : "bg-white ring-forest-900/10")}>
            {label}
          </Link>
        ))}
      </nav>
      <p className="mt-4 text-sm text-ink-600">{lands.length} terrain(s). Les brouillons ne sont pas visibles tant qu&apos;ils ne sont pas soumis.</p>
      <ul className="mt-3 divide-y divide-forest-900/10 overflow-hidden rounded-card bg-white ring-1 ring-forest-900/10">
        {lands.map((l) => <AdminLandRow key={l.id} l={l} />)}
      </ul>
    </div>
  );
}
