import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForms } from "@/components/auth/sign-in-forms";
import { getSession } from "@/lib/auth/session";
import { homeForRoles, safeNext } from "@/lib/validation/auth";

export const metadata: Metadata = { title: "Se connecter" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next, "");
  const session = await getSession();
  if (session) redirect(next || homeForRoles(session.profile?.roles ?? []));

  return (
    <>
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Se connecter</h1>
      <p className="mt-2 text-ink-600">Heureux de vous revoir.</p>
      <div className="mt-8">
        <SignInForms next={next || undefined} />
      </div>
      <p className="mt-8 text-center text-sm text-ink-600">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-semibold text-forest-800 underline underline-offset-2">
          Créer un compte
        </Link>
      </p>
    </>
  );
}
