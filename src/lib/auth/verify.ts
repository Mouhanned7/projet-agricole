import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Appelé uniquement par les routes /auth/* après un lien e-mail valide ou un
 * retour Google : l'adresse est prouvée (D7). Volontairement hors du fichier
 * « use server » pour ne pas être appelable depuis le navigateur.
 */
export async function markEmailVerified(userId: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY manquante : e-mail non marqué comme vérifié");
    return;
  }
  const { error } = await createServiceClient()
    .from("profiles")
    .update({ email_verified_at: new Date().toISOString() })
    .eq("id", userId)
    .is("email_verified_at", null);
  if (error) console.error("markEmailVerified", error.message);
}
