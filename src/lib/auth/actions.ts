"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { authErrorMessage, NOT_CONFIGURED } from "@/lib/auth/messages";
import { getSession, siteOrigin } from "@/lib/auth/session";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import {
  emailOnlySchema,
  homeForRoles,
  newPasswordSchema,
  normalizePhone,
  profileSchema,
  roleFromParam,
  safeNext,
  signInSchema,
  signUpSchema,
} from "@/lib/validation/auth";

export interface ActionState {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
}

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

/** Valeurs renvoyées au formulaire en cas d'erreur (jamais le mot de passe). */
function keep(formData: FormData, ...keys: string[]): Record<string, string> {
  return Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "")]));
}

/** Envoie le lien de vérification / connexion par e-mail (D1 : pas de SMS). */
async function sendEmailLink(email: string, next: string) {
  const supabase = await createClient();
  return supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${await siteOrigin()}/auth/confirm?next=${encodeURIComponent(next)}` },
  });
}

// ---------------------------------------------------------------------------
// Inscription (INS-01 à INS-08)
// ---------------------------------------------------------------------------
export async function signUp(_: ActionState, formData: FormData): Promise<ActionState> {
  const values = keep(formData, "role", "fullName", "email");
  const parsed = signUpSchema.safeParse({
    role: formData.get("role") || undefined,
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    acceptTerms: formData.get("acceptTerms") === "on",
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  if (!supabaseConfigured) return { error: NOT_CONFIGURED, values };

  const { role, fullName, email, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role } },
  });
  if (error) {
    console.error("signUp", error.status, error.code, error.message);
    return { error: authErrorMessage(error), values };
  }
  if (!data.session) {
    // « Confirm email » est encore activé côté Supabase (voir docs/SUPABASE_SETUP.md).
    return { success: "Compte créé. Ouvrez le lien reçu par e-mail pour vous connecter.", values };
  }

  const destination = homeForRoles([role]);
  const sent = await sendEmailLink(email, destination); // vérification non bloquante (INS-05)
  if (sent.error) console.error("sendEmailLink", sent.error.status, sent.error.message);
  revalidatePath("/", "layout");
  redirect(role === "owner" ? "/espace-porteur?bienvenue=1" : "/catalogue?bienvenue=1");
}

// ---------------------------------------------------------------------------
// Connexion
// ---------------------------------------------------------------------------
export async function signIn(_: ActionState, formData: FormData): Promise<ActionState> {
  const values = keep(formData, "email");
  const parsed = signInSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  if (!supabaseConfigured) return { error: NOT_CONFIGURED, values };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: authErrorMessage(error), values };

  const { data: profile } = await supabase.from("profiles").select("roles").eq("id", data.user.id).maybeSingle();
  revalidatePath("/", "layout");
  redirect(safeNext(String(formData.get("next") ?? ""), homeForRoles(profile?.roles ?? [])));
}

/** INS-04 : connexion sans mot de passe, par lien envoyé par e-mail. */
export async function sendMagicLink(_: ActionState, formData: FormData): Promise<ActionState> {
  const values = keep(formData, "email");
  const parsed = emailOnlySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  if (!supabaseConfigured) return { error: NOT_CONFIGURED, values };

  const { error } = await sendEmailLink(parsed.data.email, safeNext(String(formData.get("next") ?? ""), "/"));
  if (error?.status === 429) return { error: authErrorMessage(error), values };
  // Même message que le compte existe ou non (pas d'énumération des comptes).
  return { success: `Si un compte existe pour ${parsed.data.email}, un lien de connexion vient d'être envoyé.`, values };
}

/** INS-04 : Google. Le profil choisi est transmis au retour pour les nouveaux comptes. */
export async function signInWithGoogle(formData: FormData) {
  if (!supabaseConfigured) redirect("/auth/erreur?raison=config");
  const role = roleFromParam(String(formData.get("role") ?? ""));
  const next = safeNext(String(formData.get("next") ?? ""), "");
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (next) params.set("next", next);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await siteOrigin()}/auth/callback?${params}` },
  });
  if (error || !data.url) redirect("/auth/erreur?raison=google");
  redirect(data.url);
}

export async function signOut() {
  if (supabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/");
}

// ---------------------------------------------------------------------------
// Mot de passe
// ---------------------------------------------------------------------------
export async function requestPasswordReset(_: ActionState, formData: FormData): Promise<ActionState> {
  const values = keep(formData, "email");
  const parsed = emailOnlySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  if (!supabaseConfigured) return { error: NOT_CONFIGURED, values };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteOrigin()}/auth/confirm?next=/compte/nouveau-mot-de-passe`,
  });
  if (error?.status === 429) return { error: authErrorMessage(error), values };
  return { success: `Si un compte existe pour ${parsed.data.email}, un lien de réinitialisation vient d'être envoyé.`, values };
}

export async function updatePassword(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = newPasswordSchema.safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const session = await getSession();
  if (!session) return { error: "Le lien a expiré. Demandez un nouveau lien de réinitialisation." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: authErrorMessage(error) };
  redirect(`${homeForRoles(session.profile?.roles ?? [])}?motdepasse=1`);
}

// ---------------------------------------------------------------------------
// Compte (§2.2, INS-05, INS-09)
// ---------------------------------------------------------------------------
export async function resendVerification(): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Connectez-vous pour recevoir le lien." };
  if (session.profile?.email_verified_at) return { success: "Votre adresse est déjà confirmée." };
  const { error } = await sendEmailLink(session.email, homeForRoles(session.profile?.roles ?? []));
  if (error) return { error: authErrorMessage(error) };
  return { success: `Lien envoyé à ${session.email}. Pensez à vérifier vos courriers indésirables.` };
}

export async function updateProfile(_: ActionState, formData: FormData): Promise<ActionState> {
  const values = keep(formData, "fullName", "dial", "phoneLocal", "city", "country", "locale");
  const session = await getSession();
  if (!session) return { error: "Votre session a expiré. Reconnectez-vous.", values };

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: normalizePhone(values.dial || "+216", values.phoneLocal) ?? "",
    city: formData.get("city") ?? "",
    country: formData.get("country") ?? "",
    locale: formData.get("locale") || "fr",
  });
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    if (errors.phone) errors.phoneLocal = errors.phone;
    return { fieldErrors: errors, values };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      city: parsed.data.city,
      country: parsed.data.country,
      locale: parsed.data.locale,
    })
    .eq("id", session.userId);
  if (error) return { error: "Enregistrement impossible. Réessayez.", values };
  revalidatePath("/", "layout");
  return { success: "Profil enregistré.", values };
}

/** INS-09 : un même compte ajoute l'autre profil sans nouvelle inscription. */
export async function addRole(formData: FormData) {
  const role = roleFromParam(String(formData.get("role") ?? ""));
  const session = await getSession();
  if (!session?.profile || !role) redirect("/connexion");
  if (!session.profile.roles.includes(role)) {
    const supabase = await createClient();
    await supabase
      .from("profiles")
      .update({ roles: [...session.profile.roles, role] })
      .eq("id", session.userId);
  }
  revalidatePath("/", "layout");
  redirect(role === "owner" ? "/espace-porteur" : "/catalogue");
}
