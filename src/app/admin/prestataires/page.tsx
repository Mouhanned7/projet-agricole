import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin/guard";
import { GOVERNORATES } from "@/lib/data/tunisia";
import { addProvider, setQuoteStatus, toggleProvider } from "@/lib/extras/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Prestataires · Administration" };
const input = "rounded-xl border border-forest-900/15 bg-white px-3 py-2 text-sm";
const btn = "rounded-full bg-forest-900 px-4 py-2 text-sm text-cream-50";

export default async function AdminProviders() {
  await requireAdminPage("/admin/prestataires");
  const db = await createClient();
  const [{ data: providers }, { data: quotes }] = await Promise.all([
    db.from("providers").select("*").order("created_at", { ascending: false }),
    db.from("quote_requests").select("*, providers(name), profiles(full_name, phone)").order("created_at", { ascending: false }),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Prestataires</h1>
      <form action={addProvider} className="grid gap-3 sm:grid-cols-6">
        <input name="name" required placeholder="Nom" className={input} />
        <input name="service" required placeholder="Service (ex. Irrigation)" className={input} />
        <select name="gouv" className={input}><option value="">Toute la Tunisie</option>{GOVERNORATES.map((g) => <option key={g.id} value={g.id}>{g.fr}</option>)}</select>
        <input name="phone" placeholder="Téléphone" className={input} />
        <input name="email" type="email" placeholder="E-mail" className={input} />
        <button className={btn}>Ajouter</button>
      </form>
      <ul className="space-y-2">
        {providers?.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-card bg-white p-3 text-sm ring-1 ring-forest-900/10">
            <span>{p.name} · {p.service} · {p.phone ?? ""} {p.email ?? ""}</span>
            <form action={toggleProvider}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="active" value={p.active ? "0" : "1"} /><button className="underline">{p.active ? "Masquer" : "Réactiver"}</button></form>
          </li>
        ))}
      </ul>
      <h2 className="text-lg font-semibold">Demandes de devis</h2>
      <ul className="space-y-2">
        {quotes?.map((q) => (
          <li key={q.id} className="rounded-card bg-white p-3 text-sm ring-1 ring-forest-900/10">
            <p className="font-medium">{q.providers?.name} ← {q.profiles?.full_name} {q.profiles?.phone ?? ""}</p>
            <p>{q.message}</p>
            <form action={setQuoteStatus} className="mt-2 flex gap-2"><input type="hidden" name="id" value={q.id} />
              <select name="status" defaultValue={q.status} className={input}><option value="new">Nouvelle</option><option value="sent">Transmise</option><option value="done">Terminée</option></select><button className={btn}>OK</button></form>
          </li>
        ))}
      </ul>
    </div>
  );
}
