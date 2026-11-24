import { describe, expect, it } from "vitest";
import { homeForRoles, normalizePhone, profileSchema, roleFromParam, safeNext, signUpSchema } from "./auth";

const valid = { role: "investor", fullName: "Amine Ben Ali", email: " Amine@Exemple.TN ", password: "olivier2026", acceptTerms: true };

describe("inscription (INS-02, INS-06)", () => {
  it("accepte 4 champs + profil et normalise l'e-mail", () => {
    const r = signUpSchema.safeParse(valid);
    expect(r.success && r.data.email).toBe("amine@exemple.tn");
  });

  it("messages d'erreur en français", () => {
    const r = signUpSchema.safeParse({ ...valid, role: undefined, email: "pas-un-email", password: "court", acceptTerms: false });
    expect(r.success).toBe(false);
    const msgs = Object.fromEntries((r.error?.issues ?? []).map((i) => [i.path[0], i.message]));
    expect(msgs.role).toMatch(/Choisissez votre profil/);
    expect(msgs.email).toMatch(/ne semble pas valide/);
    expect(msgs.password).toMatch(/au moins 8 caractères/);
    expect(msgs.acceptTerms).toMatch(/conditions d'utilisation/);
  });

  it("refuse le rôle admin", () => {
    expect(signUpSchema.safeParse({ ...valid, role: "admin" }).success).toBe(false);
  });
});

describe("redirections (INS-08)", () => {
  it("investisseur → catalogue, porteur → espace porteur, double profil → catalogue", () => {
    expect(homeForRoles(["investor"])).toBe("/catalogue");
    expect(homeForRoles(["owner"])).toBe("/espace-porteur");
    expect(homeForRoles(["owner", "investor"])).toBe("/catalogue");
    expect(homeForRoles(["admin"])).toBe("/admin");
  });

  it("paramètre ?profil", () => {
    expect(roleFromParam("porteur")).toBe("owner");
    expect(roleFromParam("investisseur")).toBe("investor");
    expect(roleFromParam("admin")).toBeNull();
  });

  it("refuse les redirections externes", () => {
    expect(safeNext("/compte")).toBe("/compte");
    expect(safeNext("//evil.com")).toBe("/");
    expect(safeNext("https://evil.com")).toBe("/");
    expect(safeNext("/\\evil.com")).toBe("/");
  });
});

describe("téléphone international (INS-03)", () => {
  it("assemble indicatif et numéro local", () => {
    expect(normalizePhone("+216", "98 123 456")).toBe("+21698123456");
    expect(normalizePhone("+33", "06 12 34 56 78")).toBe("+33612345678");
    expect(normalizePhone("+216", "0033 6 12 34 56 78")).toBe("+33612345678");
    expect(normalizePhone("+216", "")).toBeNull();
  });

  it("valide le format dans le profil", () => {
    const base = { fullName: "Amine", city: "", country: "", locale: "fr" };
    expect(profileSchema.safeParse({ ...base, phone: "+21698123456" }).success).toBe(true);
    expect(profileSchema.safeParse({ ...base, phone: "" }).success).toBe(true);
    expect(profileSchema.safeParse({ ...base, phone: "+216" }).success).toBe(false);
  });
});
