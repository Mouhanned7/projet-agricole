import { describe, expect, it } from "vitest";
import { authErrorMessage } from "./messages";

describe("messages d'erreur d'authentification (INS-06)", () => {
  it("échec d'envoi de l'e-mail de confirmation : message clair", () => {
    expect(authErrorMessage({ status: 500, message: "Error sending confirmation email" })).toMatch(/e-mail de confirmation n'a pas pu être envoyé/);
    expect(authErrorMessage({ status: 500, message: "Error sending magic link email" })).toMatch(/n'a pas pu être envoyé/);
  });
  it("compte existant et identifiants incorrects", () => {
    expect(authErrorMessage({ code: "user_already_exists" })).toMatch(/existe déjà/);
    expect(authErrorMessage({ code: "invalid_credentials" })).toBe("E-mail ou mot de passe incorrect.");
  });
});
