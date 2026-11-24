import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Mot de passe oublié</h1>
      <p className="mt-2 text-ink-600">Indiquez votre adresse : nous vous envoyons un lien pour en choisir un nouveau.</p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
      <p className="mt-8 text-center text-sm text-ink-600">
        <Link href="/connexion" className="font-semibold text-forest-800 underline underline-offset-2">
          Retour à la connexion
        </Link>
      </p>
    </>
  );
}
