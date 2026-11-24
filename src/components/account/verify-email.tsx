"use client";

import { CheckCircle2, MailWarning, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { resendVerification, type ActionState } from "@/lib/auth/actions";

function ResendButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="font-semibold underline underline-offset-2 disabled:opacity-60">
      {pending ? "Envoi…" : "Renvoyer le lien"}
    </button>
  );
}

/** INS-05 : rappel non bloquant tant que l'adresse n'est pas confirmée. */
export function VerifyEmailBanner({ email }: { email: string }) {
  const [state, action] = useActionState<ActionState, FormData>(resendVerification, {});
  return (
    <div className="border-b border-gold-500/30 bg-gold-100 text-sm text-forest-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
        <MailWarning className="hidden size-5 shrink-0 text-gold-600 sm:block" aria-hidden />
        <p className="flex-1">
          {state.success ?? state.error ?? (
            <>
              Confirmez votre adresse <strong>{email}</strong> : le lien est nécessaire avant votre premier contact ou la
              soumission d&apos;un terrain.
            </>
          )}
        </p>
        {!state.success && (
          <form action={action}>
            <ResendButton />
          </form>
        )}
      </div>
    </div>
  );
}

const FLASH: Record<string, string> = {
  verifie: "Votre adresse e-mail est confirmée. Merci !",
  bienvenue: "Bienvenue sur VerdOlive ! Votre compte est créé.",
  motdepasse: "Votre nouveau mot de passe est enregistré.",
};

/** Message de confirmation affiché après une redirection (?verifie=1, ?bienvenue=1…). */
export function FlashMessage() {
  const params = useSearchParams();
  const [closed, setClosed] = useState(false);
  const key = Object.keys(FLASH).find((k) => params.get(k) === "1");
  if (!key || closed) return null;
  return (
    <div role="status" className="border-b border-olive-500/30 bg-olive-100 text-sm text-forest-900">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <CheckCircle2 className="size-5 shrink-0 text-olive-600" aria-hidden />
        <p className="flex-1">{FLASH[key]}</p>
        <button type="button" onClick={() => setClosed(true)} aria-label="Fermer" className="text-ink-600 hover:text-forest-900">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
