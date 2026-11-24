import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { markEmailVerified } from "@/lib/auth/verify";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { homeForRoles, safeNext } from "@/lib/validation/auth";

/**
 * Lien reçu par e-mail (vérification, connexion, réinitialisation).
 * Modèles d'e-mail Supabase : voir docs/SUPABASE_SETUP.md.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(url.searchParams.get("next"), "");
  const fail = (raison: string) => NextResponse.redirect(new URL(`/auth/erreur?raison=${raison}`, url.origin));

  if (!supabaseConfigured) return fail("config");
  if (!tokenHash || !type) return fail("lien");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error || !data.user) return fail(error?.code === "otp_expired" ? "expire" : "lien");

  // Cliquer sur le lien prouve la possession de l'adresse.
  await markEmailVerified(data.user.id);

  if (type === "recovery") return NextResponse.redirect(new URL("/compte/nouveau-mot-de-passe", url.origin));

  const { data: profile } = await supabase.from("profiles").select("roles").eq("id", data.user.id).maybeSingle();
  const dest = next || homeForRoles(profile?.roles ?? []);
  const target = new URL(dest, url.origin);
  target.searchParams.set("verifie", "1");
  return NextResponse.redirect(target);
}
