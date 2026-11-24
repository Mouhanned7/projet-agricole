import type { Metadata } from "next";
import { NewPasswordForm } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default function NewPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Nouveau mot de passe</h1>
      <p className="mt-2 text-ink-600">Choisissez un mot de passe d&apos;au moins 8 caractères.</p>
      <div className="mt-8">
        <NewPasswordForm />
      </div>
    </div>
  );
}
