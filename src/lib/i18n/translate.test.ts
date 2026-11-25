import { describe, expect, it } from "vitest";
import { GOVERNORATES } from "@/lib/data/tunisia";
import { computeRanking } from "@/lib/domain/ranking";
import { DEMO_LANDS } from "@/lib/data/demo-lands";
import { lookup, translate } from "./translate";

describe("traduction arabe", () => {
  it("textes exacts, apostrophes et espaces", () => {
    expect(translate("Se connecter")).toBe("تسجيل الدخول");
    expect(lookup("Conditions d’utilisation")).toBe("شروط الاستعمال");
    expect(translate("  Débit ")).toBe("  التدفق ");
  });
  it("phrases avec valeurs et listes", () => {
    expect(lookup("4 terrains")).toBe("4 أرض");
    expect(lookup("Étape 2 sur 7")).toBe("المرحلة 2 من 7");
    expect(lookup("Titre déclaré, eau déclarée, aucun document")).toBe("رسم مصرّح به، ماء مصرّح به، بدون وثيقة");
    expect(lookup("Korba, Nabeul")).toBe("قربة، نابل");
    expect(lookup("VO-DEMO3 · Partenariat")).toBe("VO-DEMO3 · شراكة");
  });
  it("les grands nombres restent dans le bon ordre en arabe", () => {
    expect(translate("740 000 TND")).toBe("\u2066740 000\u2069 د.ت");
    expect(translate("740 000")).toBe("\u2066740 000\u2069");
    expect(translate(translate("740 000 TND"))).toBe("\u2066740 000\u2069 د.ت");
  });
  it("les saisies des utilisateurs restent inchangées", () => {
    expect(translate("Oliveraie de Si Ahmed")).toBe("Oliveraie de Si Ahmed");
    expect(translate("Visite possible, appelez avant")).toBe("Visite possible, appelez avant");
  });
  it("tous les statuts, raisons et messages du moteur de classement sont traduits", () => {
    const missing = new Set<string>();
    for (const l of DEMO_LANDS) if (!lookup(l.ranking.reason)) missing.add(l.ranking.reason);
    const empty = computeRanking({ essentials: { objective: null, photoCount: 0 }, title: { answer: null }, water: { answer: null } });
    for (const m of [empty.reason, ...empty.actions, ...empty.blockingIssues]) if (!lookup(m)) missing.add(m);
    expect([...missing]).toEqual([]);
  });
  it("tous les gouvernorats et délégations sont traduits", () => {
    const missing = GOVERNORATES.flatMap((g) => [g.fr, ...g.delegations]).filter((n) => !lookup(n));
    expect(missing).toEqual([]);
  });
});
