import { describe, expect, it } from "vitest";
import { computeRanking } from "../domain/ranking";
import { draftSchema, emptyDraft, fromRows, offerComplete, toRankingInput, toRows, type LandDraft } from "./draft";

function filled(): LandDraft {
  return draftSchema.parse({
    objective: "partnership",
    name: "Oliveraie familiale",
    title: { answer: "yes", number: "45127/12", ownership: "joint", jointOwnersAgree: true, registry: "Nabeul" },
    water: {
      answer: "yes", sources: ["well"], availability: "year_round", flowValue: 3.5, flowUnit: "l_s", flowMeasured: true,
      shared: "yes", sharedDetails: "Tour d'eau avec le voisin",
    },
    location: { governorateId: "nabeul", delegationId: "nabeul-korba", lat: 36.6, lng: 10.9, areaHa: 12.5 },
    land: { state: "partial", trees: [{ species: "Olivier", count: 400, age: "30 ans" }] },
    offer: {
      partnershipType: "mgharsa", ownerContribution: ["Travail"], investorContribution: ["Financement"],
      ownerSharePct: 40, durationYears: 15, notes: "Ouvert à la discussion",
    },
  });
}

describe("brouillon de terrain", () => {
  it("un brouillon vide a toutes les sections", () => {
    const d = emptyDraft("sale");
    expect(d.objective).toBe("sale");
    expect(d.water.sources).toEqual([]);
    expect(d.land.trees).toEqual([]);
    expect(d.offer.included).toEqual([]);
    expect(computeRanking(toRankingInput(d)).status).toBe("incomplete");
  });

  it("aller-retour base de données sans perte (TER-05, scénario 7)", () => {
    const d = filled();
    const r = toRows(d);
    // simule ce que renvoie PostgreSQL (numeric en texte)
    const back = fromRows(
      { ...r.land, area_ha: "12.50", lat: 36.6, lng: 10.9 },
      r.title,
      { ...r.water, flow_value: "3.50" },
      { ...r.offer, owner_share_pct: "40.00" },
    );
    expect(back).toEqual(d);
  });

  it("le débit est enregistré avec son unité et sa nature (§3.2 C)", () => {
    const r = toRows(filled());
    expect(r.water).toMatchObject({ flow_value: 3.5, flow_unit: "l_s", flow_nature: "measured" });
    const noFlow = toRows(emptyDraft());
    expect(noFlow.water).toMatchObject({ flow_value: null, flow_unit: null, flow_nature: null });
  });

  it("les réponses masquées sont conservées quand on passe de Oui à Non (§3.2 C)", () => {
    const d = filled();
    d.title.answer = "no";
    expect(toRows(d).title.number).toBe("45127/12");
    expect(computeRanking(toRankingInput(d)).titleProof).toBe("none");
  });

  it("classement : complet sauf photo → Vérification nécessaire, avec photo → Prioritaire", () => {
    const d = filled();
    expect(offerComplete(d)).toBe(true);
    expect(computeRanking(toRankingInput(d)).status).toBe("needs_check");
    const r = computeRanking(toRankingInput(d, { photoCount: 2, documentsCount: 1, hasTitleUpload: true, hasWaterAnalysis: false }));
    expect(r.status).toBe("priority");
    expect(r.titleProof).toBe("document");
    expect(r.canSubmit).toBe(true);
  });

  it("refuse les valeurs hors limites", () => {
    expect(draftSchema.safeParse({ location: { lat: 50 } }).success).toBe(false);
    expect(draftSchema.safeParse({ offer: { ownerSharePct: 140 } }).success).toBe(false);
    expect(draftSchema.safeParse({ water: { sources: ["river"] } }).success).toBe(false);
  });
});
