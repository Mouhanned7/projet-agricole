import { NextResponse, type NextRequest } from "next/server";
import { markEmailVerified } from "@/lib/auth/verify";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { homeForRoles, roleFromParam, safeNext } from "@/lib/validation/auth";

/** Retour de Google (INS-04). */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const fail = (raison: string) => NextResponse.redirect(new URL(`/auth/erreur?raison=${raison}`, url.origin));
  if (!supabaseConfigured) return fail("config");
  if (!code) return fail("google");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return fail("google");

  // Google vérifie l'adresse ; le déclencheur SQL le fait aussi à la création.
  await markEmailVerified(data.user.id);

  const { data: profile } = await supabase.from("profiles").select("roles").eq("id", data.user.id).maybeSingle();
  let roles: string[] = profile?.roles ?? [];
  const requested = roleFromParam(url.searchParams.get("role"));
  if (roles.length === 0) {
    roles = [requested ?? "investor"];
    await supabase.from("profiles").update({ roles }).eq("id", data.user.id);
  }

  const dest = safeNext(url.searchParams.get("next"), homeForRoles(roles));
  return NextResponse.redirect(new URL(dest, url.origin));
}
