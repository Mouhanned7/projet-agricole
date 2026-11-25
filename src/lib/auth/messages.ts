/** Traduction des erreurs Supabase Auth en messages compréhensibles (INS-06). */
export function authErrorMessage(error: { message?: string; code?: string; status?: number } | null | undefined): string {
  const code = error?.code ?? "";
  const msg = (error?.message ?? "").toLowerCase();
  if (code === "user_already_exists" || msg.includes("already registered"))
    return "Un compte existe déjà avec cette adresse. Connectez-vous ou réinitialisez votre mot de passe.";
  if (code === "invalid_credentials" || msg.includes("invalid login credentials"))
    return "E-mail ou mot de passe incorrect.";
  if (code === "weak_password" || msg.includes("password should"))
    return "Ce mot de passe est trop simple. Choisissez-en un plus long ou moins courant.";
  if (code === "same_password") return "Le nouveau mot de passe doit être différent de l'ancien.";
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || error?.status === 429)
    return "Trop de tentatives. Patientez une minute puis réessayez.";
  if (code === "otp_expired" || msg.includes("expired"))
    return "Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau.";
  if (code === "email_address_invalid") return "Cette adresse e-mail n'est pas acceptée.";
  if (code === "signup_disabled") return "Les inscriptions sont momentanément fermées.";
  if (msg.includes("sending") && msg.includes("email"))
    return "L'e-mail de confirmation n'a pas pu être envoyé. Le service d'e-mail de VerdOlive est en cours de réglage : réessayez dans quelques minutes.";
  return "Une erreur est survenue. Réessayez dans un instant.";
}

export const NOT_CONFIGURED =
  "La connexion n'est pas encore disponible : le service d'authentification n'est pas configuré.";
