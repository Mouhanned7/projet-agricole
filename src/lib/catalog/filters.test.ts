import { describe, expect, it } from "vitest";
import { applyFilters, DEFAULT_FILTERS, filtersToSearch, parseFilters, withoutFilter, type CatalogFilters } from "./filters";
import { demoItems } from "./map";

const all = demoItems();
const run = (p: Partial<CatalogFilters>, opts = {}) => applyFilters(all, { ...DEFAULT_FILTERS, ...p }, opts);
const names = (p: Partial<CatalogFilters>) => run(p).items.map((l) => l.name);

describe("catalogue : filtres (§6.2)", () => {
  it("par défaut : 6 terrains, le cas D (ni titre ni eau) est masqué (D4)", () => {
    const r = run({});
    expect(r.total).toBe(6);
    expect(r.hiddenLow).toBe(1);
    expect(r.items.map((l) => l.name)).not.toContain("Terre de culture – Kairouan");
  });

  it("le cas D s'affiche avec « tous » ou si l'admin le règle ainsi", () => {
    expect(run({ tous: true }).total).toBe(7);
    expect(run({}, { showLowByDefault: true }).total).toBe(7);
  });

  it("scénario 9 : titre ET eau → seulement les terrains avec les deux, compteur exact", () => {
    const r = run({ titre: "avec", eau: "avec" });
    expect(r.total).toBe(4);
    expect(r.items.every((l) => l.titleAnswer === "yes" && l.waterAnswer === "yes")).toBe(true);
  });

  it("filtres rapides stricts : « Titre vérifié uniquement »", () => {
    expect(names({ titre: "verifie" })).toEqual(["Oliveraie – Cap Bon"]);
  });

  it("OU dans un même filtre, ET entre filtres", () => {
    expect(run({ offre: ["rent", "partnership"] }).total).toBe(3);
    expect(names({ offre: ["rent", "partnership"], eau: "avec" })).toEqual(["Terrain agricole – Mahdia", "Palmeraie – Tozeur"]);
  });

  it("une donnée non renseignée n'exclut pas silencieusement (débit)", () => {
    const r = run({ debitMin: 5 });
    // Sfax (6 l/s) reste, Cap Bon (4 l/s) part, les terrains sans débit restent
    expect(r.items.map((l) => l.name)).toContain("Oliveraie – Sfax");
    expect(r.items.map((l) => l.name)).not.toContain("Oliveraie – Cap Bon");
    expect(r.items.map((l) => l.name)).toContain("Oliveraie – Zaghouan");
  });

  it("source, disponibilité et débit excluent les terrains déclarés sans eau", () => {
    for (const f of [{ source: ["well"] }, { dispo: ["year_round" as const] }, { debitMin: 1 }]) {
      const r = run({ ...f, tous: true });
      expect(r.items.length).toBeGreaterThan(0);
      expect(r.items.every((l) => l.waterAnswer === "yes")).toBe(true);
    }
  });

  it("budget selon le type d'offre : le partenariat sans prix reste visible", () => {
    const r = run({ budMax: 900_000 });
    expect(r.items.map((l) => l.name)).toEqual(expect.arrayContaining(["Oliveraie – Cap Bon", "Palmeraie – Tozeur"]));
    expect(r.items.map((l) => l.name)).not.toContain("Oliveraie – Sfax");
  });

  it("aucun résultat : suggère le filtre à retirer", () => {
    const r = run({ titre: "verifie", offre: ["rent"] });
    expect(r.total).toBe(0);
    expect(r.suggestion).toMatchObject({ key: "titre", count: 1 });
  });
});

describe("catalogue : tri (§6.3)", () => {
  it("Recommandés : titre et eau d'abord", () => {
    expect(run({}).items[0].name).toBe("Oliveraie – Cap Bon");
    expect(run({}).items.at(-1)?.rankingStatus).toBe("needs_check");
  });

  it("prix croissant : les partenariats (sans prix) en fin de liste", () => {
    const items = run({ tri: "prix_asc" }).items;
    expect(items[0].name).toBe("Verger d'amandiers – Sidi Bouzid");
    expect(items.slice(-2).every((l) => l.objective === "partnership")).toBe(true);
  });

  it("débit : terrains sans débit en fin de liste", () => {
    const items = run({ tri: "debit" }).items;
    expect(items.slice(0, 2).map((l) => l.name)).toEqual(["Oliveraie – Sfax", "Oliveraie – Cap Bon"]);
  });
});

describe("catalogue : adresse partageable", () => {
  it("aller-retour URL ↔ filtres", () => {
    const f: CatalogFilters = { ...DEFAULT_FILTERS, titre: "avec", offre: ["sale", "rent"], gouv: "nabeul", surfMin: 10, tri: "prix_asc" };
    const search = filtersToSearch(f);
    expect(search).toBe("titre=avec&offre=sale%2Crent&gouv=nabeul&surfMin=10&tri=prix_asc");
    expect(parseFilters(Object.fromEntries(new URLSearchParams(search)))).toEqual(f);
  });

  it("valeurs invalides ignorées, délégation sans gouvernorat ignorée", () => {
    const f = parseFilters({ titre: "n'importe", offre: "sale,hack", deleg: "x", surfMin: "-3", tri: "drop" });
    expect(f).toEqual({ ...DEFAULT_FILTERS, offre: ["sale"] });
  });

  it("retirer le gouvernorat retire aussi la délégation", () => {
    const f = withoutFilter({ ...DEFAULT_FILTERS, gouv: "nabeul", deleg: "nabeul-korba" }, "gouv");
    expect(f.gouv).toBeNull();
    expect(f.deleg).toBeNull();
  });
});
