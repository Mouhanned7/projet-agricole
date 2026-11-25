import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/dossier-actions";
import { getCatalogSettings } from "@/lib/catalog/source";
import { saveWeights } from "@/lib/admin/actions";
import { requireAdminPage } from "@/lib/admin/guard";
import { normalizeWeights } from "@/lib/domain/ranking";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Réglages · Administration" };

/** CLA-04 : réglages du classement sans intervention du développeur. */
export default async function SettingsPage() {
  await requireAdminPage("/admin/reglages");
  const s = await getCatalogSettings();
  const { data: w } = await (await createClient()).from("settings").select("value").eq("key", "ranking.weights").maybeSingle();
  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Réglages du catalogue</h1>
      <div className="mt-6">
        <SettingsForm showLow={s.showLowByDefault} order={s.sortOrder} />
      </div>
      <form action={saveWeights} className="mt-6 rounded-card bg-white p-5 ring-1 ring-forest-900/10">
        <p className="font-semibold text-ink-900">Points des scores juridique et hydrique (0 à 100)</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(normalizeWeights(w?.value)).map(([k, v]) => (
            <label key={k} className="text-sm text-ink-600">
              {k}
              <input name={k} type="number" min="0" max="100" defaultValue={v} className="w-full rounded-lg border border-forest-900/15 px-2 py-1.5" />
            </label>
          ))}
        </div>
        <button className="mt-4 rounded-full bg-forest-900 px-5 py-2.5 text-sm font-medium text-cream-50">Enregistrer et recalculer</button>
      </form>
    </div>
  );
}
