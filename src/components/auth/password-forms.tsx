"use client";

import { useActionState } from "react";
import { Field, FormAlert, PasswordField, SubmitButton } from "@/components/ui/form";
import { requestPasswordReset, updatePassword, type ActionState } from "@/lib/auth/actions";

export function ForgotPasswordForm() {
  const [state, action] = useActionState<ActionState, FormData>(requestPasswordReset, {});
  return (
    <form action={action} noValidate className="space-y-5">
      <Field
        label="Adresse e-mail"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <FormAlert error={state.error} success={state.success} />
      <SubmitButton pendingLabel="Envoi…">Recevoir un lien de réinitialisation</SubmitButton>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action] = useActionState<ActionState, FormData>(updatePassword, {});
  return (
    <form action={action} noValidate className="space-y-5">
      <PasswordField
        label="Nouveau mot de passe"
        name="password"
        autoComplete="new-password"
        hint="8 caractères minimum."
        error={state.fieldErrors?.password}
      />
      <PasswordField
        label="Confirmez le mot de passe"
        name="confirm"
        autoComplete="new-password"
        error={state.fieldErrors?.confirm}
      />
      <FormAlert error={state.error} />
      <SubmitButton pendingLabel="Enregistrement…">Enregistrer le mot de passe</SubmitButton>
    </form>
  );
}
