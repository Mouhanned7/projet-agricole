import type { Metadata } from "next";
import { LandCard } from "@/components/land-card";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = { title: "Terrains disponibles" };

/** INS-01 → INS-08 : destination de l'investisseur. Consultable sans compte (D2). */
export default function CatalogPage() {
  const { visible, hiddenLow } = getCatalog();
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Terrains disponibles</h1>
      <p className="mt-2 text-ink-600">
        {visible.length} terrains, triés par « Recommandés » : titre foncier et eau d&apos;abord, puis preuves et complétude.
      </p>
      <p className="mt-1 text-sm text-ink-400">Les filtres et la recherche arrivent avec le prochain lot (Sprint 4).</p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((land, i) => (
          <LandCard key={land.id} land={land} index={i} />
        ))}
      </div>
      {hiddenLow > 0 && (
        <p className="mt-6 text-center text-sm text-ink-600">
          {hiddenLow} terrain{hiddenLow > 1 ? "s" : ""} sans titre ni eau masqué{hiddenLow > 1 ? "s" : ""} par défaut.
        </p>
      )}
      <p className="mt-2 text-center text-xs text-ink-400">Données de démonstration, fictives.</p>
    </div>
  );
}
