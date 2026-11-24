import { describe, expect, it } from "vitest";
import { compareRecommended, computeRanking, normalizeTitleNumber, validateTitleNumber } from "./ranking";
import type { LandForRanking } from "./types";

function land(overrides: Partial<LandForRanking> = {}): LandForRanking {
  return {
    essentials: {
      objective: "sale",
      governorate: "Nabeul",
      delegation: "Korba",
      areaHa: 50,
      photoCount: 3,
      ...overrides.essentials,
    },
    title: { answer: "yes", number: "12345/22", ownership: "individual", ...overrides.title },
    water: { answer: "yes", sources: ["well"], availability: "year_round", ...overrides.water },
    extras: overrides.extras,
    agriScore: overrides.agriScore,
    publishedAt: overrides.publishedAt,
  };
}

const toSortable = (l: LandForRanking, publishedAt = "2026-11-01") => {
  const r = computeRanking(l);
  return {
    status: r.status,
    titleProof: r.titleProof,
    waterProof: r.waterProof,
    hasFlow: Boolean(l.water.flow),
    agriScore: l.agriScore ?? null,
    completeness: r.scores.completeness,
    publishedAt,
  };
};

describe("statut de classement (§5.1)", () => {
  it("cas A : titre Oui + eau Oui + essentiels complets → Prioritaire", () => {
    expect(computeRanking(land()).status).toBe("priority");
  });

  it("cas A sans photo → Vérification nécessaire", () => {
    expect(computeRanking(land({ essentials: { objective: "sale", photoCount: 0, areaHa: 10, governorate: "Sfax", delegation: "Agareb" } })).status).toBe("needs_check");
  });

  it("cas B : titre Oui + eau Non → Vérification nécessaire", () => {
    expect(computeRanking(land({ water: { answer: "no", nearbySource: "no" } })).status).toBe("needs_check");
  });

  it("cas C : titre « Je ne sais pas » + eau Oui → Vérification nécessaire", () => {
    const r = computeRanking(land({ title: { answer: "unknown" } }));
    expect(r.status).toBe("needs_check");
    expect(r.reason).toContain("Titre non confirmé");
  });

  it("cas D : titre Non + eau Non → Non prioritaire", () => {
    const r = computeRanking(land({ title: { answer: "no", altDocument: "none" }, water: { answer: "no", nearbySource: "unknown" } }));
    expect(r.status).toBe("low");
  });

  it("cas E : réponse manquante → À compléter et non soumettable", () => {
    const r = computeRanking(land({ water: { answer: null } }));
    expect(r.status).toBe("incomplete");
    expect(r.canSubmit).toBe(false);
  });
});

describe("règles de saisie (§3.2, scénarios 3 à 6, 20, 21)", () => {
  it("scénario 3 : titre Oui sans numéro bloque la soumission", () => {
    const r = computeRanking(land({ title: { answer: "yes", number: "", ownership: "individual" } }));
    expect(r.canSubmit).toBe(false);
    expect(r.blockingIssues.join()).toMatch(/numéro du titre/);
  });

  it("scénario 4 : titre Non n'exige pas de numéro mais un autre document", () => {
    expect(computeRanking(land({ title: { answer: "no" } })).canSubmit).toBe(false);
    expect(computeRanking(land({ title: { answer: "no", altDocument: "adoulaire" } })).canSubmit).toBe(true);
  });

  it("scénario 5 : eau Oui exige source et disponibilité, pas le débit", () => {
    expect(computeRanking(land({ water: { answer: "yes", sources: [] } })).canSubmit).toBe(false);
    expect(computeRanking(land({ water: { answer: "yes", sources: ["borehole"], availability: "seasonal" } })).canSubmit).toBe(true);
  });

  it("scénario 6 : eau Non exige la question source à proximité", () => {
    expect(computeRanking(land({ water: { answer: "no" } })).canSubmit).toBe(false);
  });

  it("scénario 20 : indivision sans accord bloque", () => {
    expect(computeRanking(land({ title: { answer: "yes", number: "A-1", ownership: "joint" } })).canSubmit).toBe(false);
    expect(computeRanking(land({ title: { answer: "yes", number: "A-1", ownership: "joint", jointOwnersAgree: true } })).canSubmit).toBe(true);
  });

  it("scénario 21 : eau partagée exige des précisions", () => {
    expect(computeRanking(land({ water: { answer: "yes", sources: ["well"], availability: "year_round", shared: "yes" } })).canSubmit).toBe(false);
  });

  it("numéro de titre : contrôle léger, caractères arabes acceptés", () => {
    expect(validateTitleNumber("١٢٣٤/نابل").ok).toBe(true);
    expect(validateTitleNumber("12#45").ok).toBe(false);
    expect(normalizeTitleNumber(" 0123 45-a ")).toBe(normalizeTitleNumber("12345A"));
  });
});

describe("badges déclaré / vérifié (scénario 10, CLA-05)", () => {
  it("un numéro saisi affiche « Titre déclaré », jamais « vérifié »", () => {
    const r = computeRanking(land());
    expect(r.titleProof).toBe("declared");
    expect(r.reason).toBe("Titre déclaré, eau déclarée, aucun document");
  });

  it("seule la preuve posée par l'admin donne « vérifié »", () => {
    expect(computeRanking(land({ title: { answer: "yes", number: "1", ownership: "individual", proof: "verified" } })).titleProof).toBe("verified");
  });

  it("un débit saisi ne rend pas l'eau « documentée »", () => {
    const r = computeRanking(land({ water: { answer: "yes", sources: ["well"], availability: "year_round", flow: { value: 3, unit: "l_s", nature: "declared" } } }));
    expect(r.waterProof).toBe("declared");
  });
});

describe("tri Recommandés (§5.2, scénario 8)", () => {
  it("titre+eau, puis titre seul, puis aucun", () => {
    const a = toSortable(land(), "2026-10-01");
    const b = toSortable(land({ water: { answer: "no", nearbySource: "no" } }), "2026-11-20");
    const c = toSortable(land({ title: { answer: "no", altDocument: "none" }, water: { answer: "no", nearbySource: "no" } }), "2026-11-23");
    expect([c, b, a].sort(compareRecommended)).toEqual([a, b, c]);
  });

  it("à statut égal : titre vérifié avant document avant déclaré", () => {
    const verified = toSortable(land({ title: { answer: "yes", number: "1", ownership: "individual", proof: "verified" } }));
    const doc = toSortable(land({ title: { answer: "yes", number: "1", ownership: "individual", hasUpload: true } }));
    const declared = toSortable(land());
    expect([declared, doc, verified].sort(compareRecommended)).toEqual([verified, doc, declared]);
  });

  it("à preuve égale : eau avec débit avant eau déclarée, puis date", () => {
    const flow = toSortable(land({ water: { answer: "yes", sources: ["well"], availability: "year_round", flow: { value: 2, unit: "l_s", nature: "declared" } } }), "2026-01-01");
    const recent = toSortable(land(), "2026-11-20");
    const old = toSortable(land(), "2026-05-01");
    expect([old, recent, flow].sort(compareRecommended)).toEqual([flow, recent, old]);
  });
});
