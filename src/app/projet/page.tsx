import type { Metadata } from "next";
import { LandCard } from "@/components/land-card";
import { buttonVariants } from "@/components/ui/button";
import { CROPS, type CropKey } from "@/lib/catalog/filters";
import { matchLands, type Project } from "@/lib/catalog/matching";
import { getCatalogItems } from "@/lib/catalog/source";
import { GOVERNORATES } from "@/lib/data/tunisia";

export const metadata: Metadata = { title: "Mon projet" };

const input = "w-full rounded-xl border border-forest-900/15 bg-white px-3 py-2";

export default async function ProjectPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const num = (v?: string) => (v && Number(v) >= 0 ? Number(v) : null);
  const p: Project = {
    budget: num(q.budget),
    haMin: num(q.haMin),
    haMax: num(q.haMax),
    gouv: q.gouv || null,
    offre: q.offre || null,
    culture: q.culture && q.culture in CROPS ? (q.culture as CropKey) : null,
    eau: q.eau === "1",
    verifie: q.verifie === "1",
  };
  const asked = Object.values(p).some(Boolean);
  const matches = asked ? matchLands((await getCatalogItems()).items, p).filter((m) => m.score > 0).slice(0, 12) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Mon projet</h1>
      <p className="mt-2 text-ink-600">Décrivez ce que vous cherchez : les terrains les plus compatibles apparaissent, avec les raisons.</p>
      <form className="mt-6 grid gap-4 rounded-card bg-white p-5 ring-1 ring-forest-900/10 sm:grid-cols-4">
        <label className="text-sm">Budget maximal (DT)<input name="budget" type="number" min="0" defaultValue={q.budget} className={input} /></label>
        <label className="text-sm">Surface min (ha)<input name="haMin" type="number" min="0" defaultValue={q.haMin} className={input} /></label>
        <label className="text-sm">Surface max (ha)<input name="haMax" type="number" min="0" defaultValue={q.haMax} className={input} /></label>
        <label className="text-sm">Gouvernorat<select name="gouv" defaultValue={q.gouv ?? ""} className={input}><option value="">Indifférent</option>{GOVERNORATES.map((g) => <option key={g.id} value={g.id}>{g.fr}</option>)}</select></label>
        <label className="text-sm">Opération<select name="offre" defaultValue={q.offre ?? ""} className={input}><option value="">Indifférent</option><option value="sale">Achat</option><option value="rent">Location</option><option value="partnership">Partenariat</option></select></label>
        <label className="text-sm">Culture visée<select name="culture" defaultValue={q.culture ?? ""} className={input}><option value="">Indifférent</option>{Object.entries(CROPS).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}</select></label>
        <label className="flex items-end gap-2 text-sm"><input type="checkbox" name="eau" value="1" defaultChecked={p.eau} className="size-5" /> Eau nécessaire</label>
        <label className="flex items-end gap-2 text-sm"><input type="checkbox" name="verifie" value="1" defaultChecked={p.verifie} className="size-5" /> Titre vérifié</label>
        <button className={buttonVariants({ variant: "forest" })}>Trouver les terrains</button>
      </form>
      {asked && matches.length === 0 && <p className="mt-6 text-ink-600">Aucun terrain compatible pour le moment.</p>}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map((m, i) => (
          <div key={m.land.id} className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-forest-900">Compatibilité {m.score} %</p>
            <LandCard land={m.land} index={i} />
            <p className="text-xs text-ink-600">{m.ok.length > 0 && `Satisfaits : ${m.ok.join(", ")}. `}{m.ko.length > 0 && `Non satisfaits : ${m.ko.join(", ")}.`}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
