import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Administration" };

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/admin");
  if (!session.profile?.roles.includes("admin")) notFound();
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Administration</h1>
      <p className="mt-2 text-ink-600">File de vérification et réglages : Sprint 5.</p>
    </div>
  );
}
