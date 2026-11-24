import { describe, expect, it } from "vitest";
import { evaluateCrop, CROPS, rankCrops, type SiteData } from "./crops";
import { buildDiagnostic, fetchClimate } from "./diagnose";
import { economicEstimate, waterPressure } from "./water-economics";

const sahel: SiteData = {
  rainMm: 220, tMean: 19.5, tMinCold: 6.5, tMaxHot: 34, frostDays: 1, chillDays: 45, et0Mm: 1400, elevationM: 60,
  soilPh: 8.1, clayPct: 22, sandPct: 55,
  water: { available: false, yearRound: false, salinityGL: null, flowLs: null },
};
const oasis: SiteData = { ...sahel, rainMm: 90, tMaxHot: 41, chillDays: 5, water: { available: true, yearRound: true, salinityGL: 3, flowLs: 8 } };
const crop = (k: string) => CROPS.find((c) => c.key === k)!;

describe("aptitude par culture (§11.2)", () => {
  it("Sahel sec sans eau : l'olivier en sec est la meilleure culture, le palmier est exclu", () => {
    const ranked = rankCrops(sahel);
    expect(ranked[0].crop).toBe("olive");
    expect(ranked[0].irrigation).toBe("not_needed");
    expect(ranked.find((c) => c.crop === "date_palm")!.level).toBe("unsuitable");
  });

  it("oasis chaude avec eau : le palmier dattier est très adapté, l'amandier manque de froid", () => {
    const palm = evaluateCrop(crop("date_palm"), oasis);
    expect(palm.level).toBe("very_good");
    expect(palm.irrigation).toBe("needed");
    const almond = evaluateCrop(crop("almond"), oasis);
    expect(almond.constraints.join()).toMatch(/froid/);
    expect(almond.constraints.join()).toMatch(/salée|Salinité/);
  });

  it("chaque contrainte est expliquée", () => {
    const r = evaluateCrop(crop("cereals"), sahel);
    expect(r.constraints[0]).toMatch(/Pluie insuffisante \(220 mm\/an, 350 mm requis\)/);
  });
});

describe("pression sur l'eau (RES-04)", () => {
  it("déficit quand le débit ne couvre pas le besoin", () => {
    const wp = waterPressure({ crop: "date_palm", et0Mm: 1600, rainMm: 90, areaHa: 20, flowLs: 4, yearRound: true });
    expect(wp.needM3PerHa).toBe(Math.round(((1600 * 0.95 - 63) / 0.9) * 10));
    expect(wp.level).toBe("deficit");
    expect(wp.recommendation).toMatch(/réduire la surface/);
  });

  it("suffisant pour un olivier sur petite surface ; débit inconnu → pas de conclusion", () => {
    expect(waterPressure({ crop: "olive", et0Mm: 1300, rainMm: 300, areaHa: 5, flowLs: 5, yearRound: true }).level).toBe("sufficient");
    expect(waterPressure({ crop: "olive", et0Mm: 1300, rainMm: 300, areaHa: 5, flowLs: null, yearRound: true }).level).toBeNull();
  });
});

describe("étude économique (§6.4 G)", () => {
  it("olivier irrigué sur 10 ha : investissement, marge et retour calculés avec hypothèses", () => {
    const e = economicEstimate("olive", 10, true);
    expect(e.initialInvestmentTnd).toBe(110_000);
    expect(e.annualRevenueTnd).toBe(96_000);
    expect(e.annualMarginTnd).toBe(71_000);
    expect(e.paybackYears).toBeCloseTo(4 + (110_000 + 25_000 * 4) / 71_000, 1);
    expect(e.hypotheses.join(" ")).toMatch(/à confirmer/);
  });

  it("utilise la variante sèche quand l'irrigation n'est pas nécessaire", () => {
    expect(economicEstimate("olive", 10, false).mode).toBe("rainfed");
    expect(economicEstimate("date_palm", 2, false).mode).toBe("irrigated");
  });
});

describe("diagnostic complet", () => {
  const daily = (n: number, v: number) => Array.from({ length: n }, () => v);
  const fakeFetch = (async (url: string) => {
    if (url.includes("archive-api")) {
      const time = Array.from({ length: 365 }, (_, i) => new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10));
      return new Response(
        JSON.stringify({
          elevation: 40,
          daily: {
            time,
            temperature_2m_max: time.map((t) => (t.slice(5, 7) === "08" ? 35 : 22)),
            temperature_2m_min: time.map((t) => (t.slice(5, 7) === "01" ? 5 : 14)),
            temperature_2m_mean: daily(365, 19),
            precipitation_sum: daily(365, 0.7),
            et0_fao_evapotranspiration: daily(365, 3.8),
            shortwave_radiation_sum: daily(365, 18),
            wind_speed_10m_max: daily(365, 25),
          },
        }),
      );
    }
    return new Response("{}", { status: 503 });
  }) as typeof fetch;

  it("calcule le climat et signale les données de sol manquantes", async () => {
    const c = await fetchClimate(35, 10, fakeFetch);
    expect(c).toMatchObject({ rainMm: 255, tMean: 19, tMinCold: 5, tMaxHot: 35, frostDays: 0, chillDays: 31, et0Mm: 1387 });
    const d = buildDiagnostic(
      { lat: 35, lng: 10, areaHa: 12, exploitableAreaHa: 10, water: { available: true, yearRound: true, salinityGL: null, flowLs: 3, flowNature: "declared" }, declaredCrops: null },
      c,
      null,
      new Date("2026-11-24"),
    );
    expect(d.agriScore).toBeGreaterThan(50);
    expect(d.missing.join()).toMatch(/Analyse de sol/);
    expect(d.dataPoints.find((p) => p.label === "Débit d'eau")).toMatchObject({ nature: "déclaré" });
    expect(d.dataPoints.find((p) => p.label === "Pluie annuelle")).toMatchObject({ nature: "estimé" });
    expect(d.economics.length).toBeGreaterThan(0);
    expect(d.waterPressure?.crop).toBe(d.crops[0].crop);
  });
});
