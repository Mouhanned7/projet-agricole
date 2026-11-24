import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { demoItems } from "@/lib/catalog/map";
import { buildDiagnostic } from "@/lib/geoai/diagnose";
import { LandReport } from "./land-report";

describe("rapport PDF (§12, scénario 17)", () => {
  it("génère un PDF de 2 pages avec ou sans diagnostic", async () => {
    const land = demoItems()[0];
    const climate = { year: 2025, elevationM: 20, rainMm: 450, tMean: 19.5, tMinCold: 7, tMaxHot: 32, frostDays: 0, chillDays: 40, et0Mm: 1300, radiationMJ: 18, windMax: 40 };
    const data = buildDiagnostic(
      { lat: 36.58, lng: 10.86, areaHa: 50, exploitableAreaHa: 45, water: { available: true, yearRound: true, salinityGL: 1.2, flowLs: 4, flowNature: "measured" }, declaredCrops: "Oliviers" },
      climate,
      { ph: 7.8, clayPct: 30, sandPct: 40, socGkg: 12, nitrogenGkg: 1.1 },
    );
    for (const diag of [null, { data, agriScore: data.agriScore, status: "validated" as const, generatedAt: data.generatedAt, validatedAt: data.generatedAt, validationNotes: null }]) {
      const pdf = await renderToBuffer(createElement(LandReport, { land, diag, generatedAt: new Date("2026-11-24") }) as Parameters<typeof renderToBuffer>[0]);
      expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
      expect(pdf.length).toBeGreaterThan(3000);
    }
  }, 30_000);
});
