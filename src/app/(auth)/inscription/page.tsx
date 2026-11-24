import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { getSession } from "@/lib/auth/session";
import { homeForRoles, roleFromParam } from "@/lib/validation/auth";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ profil?: string }> }) {
  const session = await getSession();
  if (session) redirect(homeForRoles(session.profile?.roles ?? []));
  const role = roleFromParam((await searchParams).profil);

  return (
    <>
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Créer un compte</h1>
      <p className="mt-2 text-ink-600">Moins d&apos;une minute. Le reste de votre profil se complète plus tard.</p>

      <div className="mt-8">
        <SignUpForm initialRole={role} />
      </div>

      <p className="mt-8 text-center text-sm text-ink-600">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="font-semibold text-forest-800 underline underline-offset-2">
          Se connecter
        </Link>
      </p>
    </>
  );
}
