import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin/guard";
import { saveDeal } from "@/lib/extras/actions";
import { createClient } from "@/lib/supabase/server";
import { formatTnd } from "@/lib/utils";

export const metadata: Metadata = { title: "Transactions · Administration" };
const input = "rounded-xl border border-forest-900/15 bg-white px-3 py-2 text-sm";
const btn = "rounded-full bg-forest-900 px-4 py-2 text-sm text-cream-50";
const STAGES = [["negotiation", "Négociation"], ["signed", "Signée"], ["closed", "Concrétisée"], ["cancelled", "Annulée"]] as const;
const Stage = ({ value }: { value?: string }) => <select name="stage" defaultValue={value} className={input}>{STAGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>;
const FIELDS = [["amount", "Montant (TND)"], ["commission", "Commission (TND)"], ["hectares", "Hectares"], ["trees", "Arbres plantés"], ["jobs", "Emplois"], ["women", "Femmes"], ["youth", "Jeunes"]];

export default async function Deals() {
  await requireAdminPage("/admin/transactions");
  const db = await createClient();
  const [{ data: deals }, { data: lands }] = await Promise.all([
    db.from("deals").select("*, lands(title, ref)").order("created_at", { ascending: false }),
    db.from("lands").select("id, title, ref").neq("status", "draft").order("title"),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Transactions et commissions</h1>
      <form action={saveDeal} className="grid gap-3 rounded-card bg-white p-4 ring-1 ring-forest-900/10 sm:grid-cols-4">
        <select name="land" className={input}><option value="">Terrain</option>{lands?.map((l) => <option key={l.id} value={l.id}>{l.title ?? l.ref}</option>)}</select>
        <input name="investor" required placeholder="Investisseur" className={input} />
        <Stage />
        {FIELDS.map(([n, l]) => <input key={n} name={n} type="number" min="0" step="any" placeholder={l} className={input} />)}
        <input name="note" placeholder="Note" className={input} />
        <button className={btn}>Ajouter</button>
      </form>
      <ul className="space-y-2">
        {deals?.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-card bg-white p-3 text-sm ring-1 ring-forest-900/10">
            <span>{d.lands?.title ?? d.lands?.ref ?? "—"} · {d.investor_name} · {formatTnd(Number(d.amount_tnd))} · commission {formatTnd(Number(d.commission_tnd))}</span>
            <form action={saveDeal} className="flex gap-2"><input type="hidden" name="id" value={d.id} /><Stage value={d.stage} /><button className={btn}>OK</button></form>
          </li>
        ))}
      </ul>
    </div>
  );
}
