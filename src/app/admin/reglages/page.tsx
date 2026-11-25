import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/dossier-actions";
import { getCatalogSettings } from "@/lib/catalog/source";
import { requireAdminPage } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Réglages · Administration" };

/** CLA-04 : réglages du classement sans intervention du développeur. */
export default async function SettingsPage() {
  await requireAdminPage("/admin/reglages");
  const s = await getCatalogSettings();
  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Réglages du catalogue</h1>
      <div className="mt-6">
        <SettingsForm showLow={s.showLowByDefault} order={s.sortOrder} />
      </div>
    </div>
  );
}
