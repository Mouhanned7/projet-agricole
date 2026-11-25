/** Matching investisseur ↔ terrains (§7) : critères expliqués, satisfaits ou non. */
import { CROPS, type CropKey } from "./filters";
import { compareWith } from "@/lib/domain/ranking";
import type { CatalogItem } from "./types";

export interface Project {
  budget: number | null;
  haMin: number | null;
  haMax: number | null;
  gouv: string | null;
  offre: string | null;
  culture: CropKey | null;
  eau: boolean;
  verifie: boolean;
}

export interface Match {
  land: CatalogItem;
  score: number;
  ok: string[];
  ko: string[];
}

export function matchLands(lands: CatalogItem[], p: Project): Match[] {
  const rank = compareWith();
  const key = (l: CatalogItem) => ({ status: l.rankingStatus, titleProof: l.titleProof, waterProof: l.waterProof, hasFlow: l.flowLs != null, agriScore: l.scoreAgri, completeness: l.scoreCompleteness, publishedAt: l.publishedAt });
  return lands
    .map((land) => {
      const ok: string[] = [];
      const ko: string[] = [];
      let total = 0;
      let got = 0;
      const test = (label: string, weight: number, pass: boolean) => {
        total += weight;
        if (pass) got += weight;
        (pass ? ok : ko).push(label);
      };
      const price = land.objective === "sale" ? land.priceTnd : land.objective === "rent" ? land.rentTnd : null;
      if (p.offre) test("Type d'opération", 25, land.objective === p.offre);
      if (p.budget != null) test("Budget", 20, price == null || price <= p.budget);
      if (p.haMin != null || p.haMax != null) test("Superficie", 15, land.areaHa != null && land.areaHa >= (p.haMin ?? 0) && land.areaHa <= (p.haMax ?? Infinity));
      if (p.gouv) test("Localisation", 15, land.governorateId === p.gouv);
      if (p.culture) test("Culture visée", 10, CROPS[p.culture].match.test(`${land.crops ?? ""} ${land.trees.map((t) => t.species).join(" ")}`.trim()));
      if (p.eau) test("Eau disponible", 15, land.waterAnswer === "yes");
      if (p.verifie) test("Titre vérifié", 10, land.titleProof === "verified");
      return { land, score: total ? Math.round((got / total) * 100) : 0, ok, ko };
    })
    // À compatibilité égale, le classement de la section 5 départage.
    .sort((a, b) => b.score - a.score || rank(key(a.land), key(b.land)));
}
