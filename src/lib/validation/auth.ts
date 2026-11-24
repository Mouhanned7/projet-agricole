/**
 * Schémas de validation partagés client / serveur, messages en français (INS-06).
 */
import { z } from "zod";

export const ROLES = ["investor", "owner"] as const;
export type Role = (typeof ROLES)[number];

/** Paramètre d'URL ?profil=investisseur|porteur → rôle. */
export function roleFromParam(p: string | string[] | undefined | null): Role | null {
  const v = Array.isArray(p) ? p[0] : p;
  if (v === "investisseur" || v === "investor") return "investor";
  if (v === "porteur" || v === "owner") return "owner";
  return null;
}

/** INS-08 : destination après inscription ou connexion. */
export function homeForRoles(roles: readonly string[]): string {
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("owner") && !roles.includes("investor")) return "/espace-porteur";
  return "/catalogue";
}

/** Évite les redirections ouvertes : seuls les chemins internes sont acceptés. */
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

const email = z
  .string()
  .trim()
  .min(1, "Indiquez votre adresse e-mail.")
  .email("Cette adresse e-mail ne semble pas valide (exemple : nom@domaine.com).")
  .transform((v) => v.toLowerCase());

const password = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
  .max(72, "Le mot de passe est trop long (72 caractères maximum).");

/** INS-02 : 4 champs maximum (+ le choix du profil). */
export const signUpSchema = z.object({
  role: z.enum(ROLES, "Choisissez votre profil : Investisseur ou Porteur de terrain."),
  fullName: z
    .string()
    .trim()
    .min(2, "Indiquez votre nom complet.")
    .max(80, "Le nom est trop long (80 caractères maximum)."),
  email,
  password,
  acceptTerms: z.literal(true, "Vous devez accepter les conditions d'utilisation pour continuer."),
});
export type SignUpInput = z.input<typeof signUpSchema>;

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Indiquez votre mot de passe."),
});

export const emailOnlySchema = z.object({ email });

export const newPasswordSchema = z
  .object({ password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Les deux mots de passe ne correspondent pas." });

/** INS-03 : indicatifs internationaux, la diaspora est nombreuse. */
export const DIAL_CODES = [
  { code: "+216", country: "Tunisie" },
  { code: "+33", country: "France" },
  { code: "+49", country: "Allemagne" },
  { code: "+39", country: "Italie" },
  { code: "+32", country: "Belgique" },
  { code: "+41", country: "Suisse" },
  { code: "+44", country: "Royaume-Uni" },
  { code: "+1", country: "Canada / États-Unis" },
  { code: "+971", country: "Émirats arabes unis" },
  { code: "+966", country: "Arabie saoudite" },
  { code: "+974", country: "Qatar" },
  { code: "+213", country: "Algérie" },
  { code: "+212", country: "Maroc" },
  { code: "+218", country: "Libye" },
] as const;

/** Assemble indicatif + numéro local en format international « +21698123456 ». */
export function normalizePhone(dial: string, local: string): string | null {
  const digits = local.replace(/[\s.\-()]/g, "");
  if (!digits) return null;
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  return `${dial}${digits.replace(/^0+/, "")}`;
}

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Indiquez votre nom complet.").max(80, "Le nom est trop long (80 caractères maximum)."),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\+[1-9]\d{6,14}$/.test(v), "Numéro invalide : choisissez l'indicatif puis saisissez le numéro.")
    .transform((v) => v || null),
  city: z.string().trim().max(80).transform((v) => v || null),
  country: z.string().trim().max(80).transform((v) => v || null),
  locale: z.enum(["fr", "ar", "en"]),
});
