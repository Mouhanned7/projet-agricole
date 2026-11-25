import type { Metadata } from "next";
import Link from "next/link";
import { priceLine } from "@/components/land-card";
import { buttonVariants } from "@/components/ui/button";
import { getCatalogItems } from "@/lib/catalog/source";
import type { CatalogItem } from "@/lib/catalog/types";
import { STATUS_LABEL } from "@/lib/domain/ranking";
import { formatHa } from "@/lib/utils";

export const metadata: Metadata = { title: "Comparer des terrains" };

const TITLE = { verified: "Vérifié", document: "Déclaré, document fourni", declared: "Déclaré", none: "Aucun" } as const;
const WATER = { analyzed: "Analysée", documented: "Documentée", declared: "Déclarée", none: "Aucune" } as const;
const ROWS: [string, (l: CatalogItem) => string][] = [
  ["Classement", (l) => STATUS_LABEL[l.rankingStatus]],
  ["Titre foncier", (l) => TITLE[l.titleProof]],
  ["Eau", (l) => WATER[l.waterProof]],
  ["Débit", (l) => (l.flowLs != null ? `${l.flowLs} l/s` : "Non renseigné")],
  ["Prix / conditions", (l) => priceLine(l).value],
  ["Superficie", (l) => (l.areaHa != null ? formatHa(l.areaHa) : "—")],
  ["Sol", (l) => l.extra.soilType ?? "Non renseigné"],
  ["Plantations", (l) => l.trees.map((t) => t.species).join(", ") || l.crops || "—"],
  ["Potentiel agricole", (l) => (l.scoreAgri != null ? `${l.scoreAgri}/100` : "—")],
  ["Score juridique", (l) => `${l.scoreLegal}/100`],
  ["Score hydrique", (l) => `${l.scoreWater}/100`],
  ["Travaux estimés", (l) => (l.extra.worksTnd != null ? `${l.extra.worksTnd} TND` : "—")],
];

/** Comparateur de deux ou trois terrains (§8). */
export default async function ComparePage({ searchParams }: { searchParams: Promise<{ t?: string | string[] }> }) {
  const t = (await searchParams).t;
  const ids = (Array.isArray(t) ? t : t ? [t] : []).slice(0, 3);
  const { items } = await getCatalogItems();
  const chosen = ids.map((id) => items.find((l) => l.id === id)).filter((l): l is CatalogItem => Boolean(l));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Comparer des terrains</h1>
      <form className="mt-6 grid gap-3 sm:grid-cols-4">
        {[0, 1, 2].map((i) => (
          <select key={i} name="t" defaultValue={ids[i] ?? ""} aria-label={`Terrain ${i + 1}`} className="rounded-xl border border-forest-900/15 bg-white px-3 py-2">
            <option value="">Terrain {i + 1}</option>
            {items.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        ))}
        <button className={buttonVariants({ variant: "forest" })}>Comparer</button>
      </form>
      {chosen.length < 2 ? (
        <p className="mt-6 text-ink-600">Choisissez au moins deux terrains.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-card bg-white ring-1 ring-forest-900/10">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead><tr><th className="p-3" />{chosen.map((l) => <th key={l.id} className="p-3"><Link href={`/terrains/${l.id}`} className="underline">{l.name}</Link></th>)}</tr></thead>
            <tbody>{ROWS.map(([label, get]) => <tr key={label} className="border-t border-forest-900/10"><th className="p-3 font-normal text-ink-400">{label}</th>{chosen.map((l) => <td key={l.id} className="p-3">{get(l)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
