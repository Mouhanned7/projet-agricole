"use client";

import { Check, LandPlot, Search } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { Field, FormAlert, PasswordField, SubmitButton } from "@/components/ui/form";
import { signUp, type ActionState } from "@/lib/auth/actions";
import type { Role } from "@/lib/validation/auth";
import { cn } from "@/lib/utils";

const PROFILES: { value: Role; title: string; text: string; icon: typeof Search }[] = [
  { value: "investor", title: "Investisseur", text: "Je cherche un terrain", icon: Search },
  { value: "owner", title: "Porteur de terrain", text: "Je propose mon terrain", icon: LandPlot },
];

/** INS-01 / INS-02 : profil en haut, puis 4 champs maximum. */
export function SignUpForm({ initialRole }: { initialRole: Role | null }) {
  const [state, action] = useActionState<ActionState, FormData>(signUp, {});
  const [role, setRole] = useState<Role | "">((state.values?.role as Role) || initialRole || "");
  const err = state.fieldErrors ?? {};

  return (
    <>
    <form action={action} noValidate className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-900">Vous êtes</legend>
        <div className="grid grid-cols-2 gap-3" role="radiogroup">
          {PROFILES.map(({ value, title, text, icon: Icon }) => {
            const checked = role === value;
            return (
              <label
                key={value}
                className={cn(
                  "relative flex cursor-pointer flex-col gap-2 rounded-xl border-2 bg-white p-4 transition-colors",
                  checked ? "border-forest-800 bg-olive-100/50" : "border-forest-900/10 hover:border-forest-900/30",
                  "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold-500",
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={value}
                  checked={checked}
                  onChange={() => setRole(value)}
                  className="sr-only"
                />
                <Icon className={cn("size-6", checked ? "text-forest-800" : "text-olive-600")} aria-hidden />
                <span className="font-semibold leading-tight text-ink-900">{title}</span>
                <span className="text-xs text-ink-600">{text}</span>
                {checked && (
                  <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-forest-800 text-cream-50">
                    <Check className="size-3" aria-hidden />
                  </span>
                )}
              </label>
            );
          })}
        </div>
        {err.role && (
          <p className="mt-1.5 text-sm text-danger-600" role="alert">
            {err.role}
          </p>
        )}
      </fieldset>

      <Field
        label="Nom complet"
        name="fullName"
        autoComplete="name"
        defaultValue={state.values?.fullName}
        error={err.fullName}
        placeholder="Amine Ben Ali"
      />
      <Field
        label="Adresse e-mail"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        defaultValue={state.values?.email}
        error={err.email}
        hint="Un lien de confirmation vous sera envoyé. Vous pouvez commencer sans attendre."
        placeholder="nom@exemple.com"
      />
      <PasswordField
        label="Mot de passe"
        name="password"
        autoComplete="new-password"
        error={err.password}
        hint="8 caractères minimum."
      />

      <div>
        <label className="flex items-start gap-3 text-sm text-ink-600">
          <input
            type="checkbox"
            name="acceptTerms"
            className="mt-0.5 size-5 shrink-0 rounded border-forest-900/30 accent-forest-800"
            aria-invalid={Boolean(err.acceptTerms)}
          />
          <span>
            J&apos;accepte les{" "}
            <Link href="/conditions" target="_blank" className="font-medium text-forest-800 underline underline-offset-2">
              conditions d&apos;utilisation
            </Link>{" "}
            et la{" "}
            <Link href="/confidentialite" target="_blank" className="font-medium text-forest-800 underline underline-offset-2">
              politique de confidentialité
            </Link>
            .
          </span>
        </label>
        {err.acceptTerms && (
          <p className="mt-1.5 text-sm text-danger-600" role="alert">
            {err.acceptTerms}
          </p>
        )}
      </div>

      <FormAlert error={state.error} success={state.success} />
      <SubmitButton pendingLabel="Création du compte…">Créer mon compte</SubmitButton>
    </form>
    <OrDivider />
    {/* Le profil choisi ci-dessus est transmis à Google pour les nouveaux comptes */}
    <GoogleButton role={role || undefined} label="S'inscrire avec Google" />
    </>
  );
}
