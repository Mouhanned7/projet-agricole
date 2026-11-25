import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export interface Profile {
  id: string;
  full_name: string;
  roles: ("investor" | "owner" | "admin")[];
  phone: string | null;
  city: string | null;
  country: string | null;
  locale: "fr" | "ar" | "en";
  email_verified_at: string | null;
  charter_accepted_at: string | null;
}

export interface Session {
  userId: string;
  email: string;
  profile: Profile | null;
}

/** Utilisateur connecté et son profil, mis en cache pour la durée de la requête. */
export const getSession = cache(async (): Promise<Session | null> => {
  if (!supabaseConfigured) return null;
  // Sans cookie de session, inutile d'interroger le service d'authentification.
  const jar = await cookies();
  if (!jar.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"))) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, roles, phone, city, country, locale, email_verified_at, charter_accepted_at")
    .eq("id", user.id)
    .maybeSingle<Profile>();
  return { userId: user.id, email: user.email ?? "", profile };
});

/** URL publique du site, pour les liens envoyés par e-mail. */
export async function siteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
