"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { Field, FormAlert, PasswordField, SubmitButton } from "@/components/ui/form";
import { sendMagicLink, signIn, type ActionState } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

/** Connexion par mot de passe ou par lien reçu par e-mail (INS-04). */
export function SignInForms({ next }: { next?: string }) {
  const [mode, setMode] = useState<"password" | "link">("password");
  const [pwState, pwAction] = useActionState<ActionState, FormData>(signIn, {});
  const [linkState, linkAction] = useActionState<ActionState, FormData>(sendMagicLink, {});

  return (
    <>
      <div className="mb-6 grid grid-cols-2 rounded-full bg-cream-200 p-1 text-sm font-medium" role="tablist">
        {(
          [
            ["password", "Mot de passe"],
            ["link", "Lien par e-mail"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              "rounded-full px-4 py-2 transition-colors",
              mode === value ? "bg-white text-forest-900 shadow-sm" : "text-ink-600 hover:text-forest-900",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "password" ? (
        <form action={pwAction} noValidate className="space-y-5">
          {next && <input type="hidden" name="next" value={next} />}
          <Field
            label="Adresse e-mail"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            defaultValue={pwState.values?.email}
            error={pwState.fieldErrors?.email}
          />
          <div>
            <PasswordField
              label="Mot de passe"
              name="password"
              autoComplete="current-password"
              error={pwState.fieldErrors?.password}
            />
            <Link
              href="/mot-de-passe-oublie"
              className="mt-2 inline-block text-sm font-medium text-forest-800 underline underline-offset-2"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <FormAlert error={pwState.error} />
          <SubmitButton pendingLabel="Connexion…">Se connecter</SubmitButton>
        </form>
      ) : (
        <form action={linkAction} noValidate className="space-y-5">
          {next && <input type="hidden" name="next" value={next} />}
          <Field
            label="Adresse e-mail"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            defaultValue={linkState.values?.email}
            error={linkState.fieldErrors?.email}
            hint="Nous vous envoyons un lien : un clic et vous êtes connecté, sans mot de passe."
          />
          <FormAlert error={linkState.error} success={linkState.success} />
          <SubmitButton pendingLabel="Envoi…">Recevoir un lien de connexion</SubmitButton>
        </form>
      )}

      <OrDivider />
      <GoogleButton next={next} />
    </>
  );
}
