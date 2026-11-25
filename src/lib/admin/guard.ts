import "server-only";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

/**
 * À appeler au début de CHAQUE page d'administration : dans l'App Router, la
 * mise en page ne suffit pas, la page est rendue en parallèle.
 */
export async function requireAdminPage(next = "/admin") {
  const session = await getSession();
  if (!session) redirect(`/connexion?next=${encodeURIComponent(next)}`);
  if (!session.profile?.roles.includes("admin")) notFound();
  return session;
}
