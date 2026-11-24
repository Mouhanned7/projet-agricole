"use client";

import { useActionState } from "react";
import { Field, FormAlert, SelectField, SubmitButton } from "@/components/ui/form";
import { updateProfile, type ActionState } from "@/lib/auth/actions";
import type { Profile } from "@/lib/auth/session";
import { DIAL_CODES } from "@/lib/validation/auth";

/** Sépare « +21698123456 » en indicatif + numéro local pour l'affichage. */
function splitPhone(phone: string | null): { dial: string; local: string } {
  if (!phone) return { dial: "+216", local: "" };
  const match = [...DIAL_CODES].sort((a, b) => b.code.length - a.code.length).find((d) => phone.startsWith(d.code));
  return match ? { dial: match.code, local: phone.slice(match.code.length) } : { dial: "+216", local: phone };
}

/** §2.2 : profil complété progressivement. */
export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState<ActionState, FormData>(updateProfile, {});
  const phone = splitPhone(profile.phone);
  const v = state.values;
  const err = state.fieldErrors ?? {};

  return (
    <form action={action} noValidate className="space-y-5">
      <Field label="Nom complet" name="fullName" autoComplete="name" defaultValue={v?.fullName ?? profile.full_name} error={err.fullName} />

      <div>
        <span className="mb-1.5 block text-sm font-medium text-ink-900">Téléphone (facultatif)</span>
        <div className="grid grid-cols-[minmax(0,9rem)_1fr] gap-2">
          <SelectField label="Indicatif" name="dial" defaultValue={v?.dial ?? phone.dial} className="[&>label]:sr-only">
            {DIAL_CODES.map((d) => (
              <option key={d.code} value={d.code}>
                {d.code} {d.country}
              </option>
            ))}
          </SelectField>
          <Field
            label="Numéro"
            name="phoneLocal"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            defaultValue={v?.phoneLocal ?? phone.local}
            error={err.phoneLocal}
            placeholder="98 123 456"
            className="[&>label]:sr-only"
          />
        </div>
        {!err.phoneLocal && (
          <p className="mt-1.5 text-sm text-ink-400">Visible uniquement par les personnes avec qui vous échangez, selon votre accord.</p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Ville" name="city" autoComplete="address-level2" defaultValue={v?.city ?? profile.city ?? ""} />
        <Field
          label="Pays de résidence"
          name="country"
          autoComplete="country-name"
          defaultValue={v?.country ?? profile.country ?? ""}
          placeholder="Tunisie"
        />
      </div>

      <SelectField label="Langue" name="locale" defaultValue={v?.locale ?? profile.locale}>
        <option value="fr">Français</option>
        <option value="ar">العربية (bientôt)</option>
        <option value="en">English (soon)</option>
      </SelectField>

      <FormAlert error={state.error} success={state.success} />
      <SubmitButton pendingLabel="Enregistrement…" className="sm:w-auto">
        Enregistrer
      </SubmitButton>
    </form>
  );
}
