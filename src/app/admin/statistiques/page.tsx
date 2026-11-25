import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin/guard";
import { GOVERNORATES } from "@/lib/data/tunisia";
import { WORKFLOW_LABEL } from "@/lib/lands/labels";
import { createClient } from "@/lib/supabase/server";
import { formatTnd } from "@/lib/utils";

export const metadata: Metadata = { title: "Statistiques · Administration" };

function Bars({ title, data }: { title: string; data: [string, number][] }) {
  const max = Math.max(1, ...data.map(([, v]) => v));
  return (
    <section className="rounded-card bg-white p-5 ring-1 ring-forest-900/10">
      <h2 className="font-semibold">{title}</h2>
      <ul className="mt-3 space-y-1.5 text-sm">
        {data.map(([label, v]) => (
          <li key={label} className="grid grid-cols-[10rem_1fr_3rem] items-center gap-2">
            <span>{label}</span><span className="h-2 rounded-full bg-olive-600" style={{ width: `${(v / max) * 100}%` }} /><span className="text-end">{v}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

const count = <T,>(rows: T[], key: (r: T) => string): [string, number][] =>
  Object.entries(rows.reduce<Record<string, number>>((a, r) => ((a[key(r)] = (a[key(r)] ?? 0) + 1), a), {})).sort((a, b) => b[1] - a[1]);

export default async function Stats() {
  await requireAdminPage("/admin/statistiques");
  const db = await createClient();
  const [{ data: lands }, { data: deals }, { data: visits }, { data: users }] = await Promise.all([
    db.from("lands").select("status, governorate_id, objective").limit(5000),
    db.from("deals").select("stage, amount_tnd, commission_tnd").limit(5000),
    db.from("visit_requests").select("status").limit(5000),
    db.from("profiles").select("roles").limit(5000),
  ]);
  const done = (deals ?? []).filter((d) => d.stage === "signed" || d.stage === "closed");
  const sum = (k: "amount_tnd" | "commission_tnd") => done.reduce((a, d) => a + Number(d[k]), 0);
  return (
    <div className="space-y-5">
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Statistiques</h1>
      <p className="text-ink-600">Projets signés ou concrétisés : {done.length} · volume déclaré {formatTnd(sum("amount_tnd"))} · commissions {formatTnd(sum("commission_tnd"))} · {users?.length ?? 0} comptes</p>
      <div className="grid gap-5 lg:grid-cols-2">
        <Bars title="Terrains par statut" data={count(lands ?? [], (l) => WORKFLOW_LABEL[l.status as keyof typeof WORKFLOW_LABEL])} />
        <Bars title="Terrains par gouvernorat" data={count(lands ?? [], (l) => GOVERNORATES.find((g) => g.id === l.governorate_id)?.fr ?? "Non précisé")} />
        <Bars title="Offres" data={count(lands ?? [], (l) => ({ sale: "Vente", rent: "Location", partnership: "Partenariat" })[l.objective as "sale"] ?? "Non précisé")} />
        <Bars title="Demandes de visite" data={count(visits ?? [], (v) => v.status)} />
      </div>
    </div>
  );
}
