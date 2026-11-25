import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Comptes · Administration" };

const ROLE: Record<string, string> = { investor: "Investisseur", owner: "Porteur", admin: "Admin" };

/** §9 : consultation des comptes. */
export default async function AccountsPage() {
  await requireAdminPage("/admin/comptes");
  const { data } = await (await createClient()).from("profiles").select("id, full_name, roles, phone, country, email_verified_at, created_at").order("created_at", { ascending: false }).limit(500);
  return (
    <div>
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Comptes ({data?.length ?? 0})</h1>
      <div className="mt-6 overflow-x-auto rounded-card bg-white ring-1 ring-forest-900/10">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="text-ink-400"><tr><th className="p-3">Nom</th><th className="p-3">Profils</th><th className="p-3">Téléphone</th><th className="p-3">Pays</th><th className="p-3">E-mail confirmé</th><th className="p-3">Inscrit le</th></tr></thead>
          <tbody>
            {data?.map((u) => (
              <tr key={u.id} className="border-t border-forest-900/10">
                <td className="p-3 font-medium">{u.full_name}</td>
                <td className="p-3">{(u.roles as string[]).map((r) => ROLE[r] ?? r).join(", ")}</td>
                <td className="p-3">{u.phone ?? "—"}</td>
                <td className="p-3">{u.country ?? "—"}</td>
                <td className="p-3">{u.email_verified_at ? "Oui" : "Non"}</td>
                <td className="p-3">{new Date(u.created_at).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
