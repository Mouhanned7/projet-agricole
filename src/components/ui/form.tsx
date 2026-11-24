"use client";

import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputCls =
  "block w-full rounded-xl border border-forest-900/15 bg-white px-4 py-3 text-base text-ink-900 placeholder:text-ink-400 transition-colors focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-500/30 aria-[invalid=true]:border-danger-600 aria-[invalid=true]:ring-danger-600/20";

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  hint?: React.ReactNode;
  error?: string;
}

/** Champ avec indication et message d'erreur sous le champ (INS-06). */
export function Field({ label, name, hint, error, className, ...input }: FieldProps) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-900">
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        className={inputCls}
        {...input}
      />
      <FieldMessage id={id} hint={hint} error={error} />
    </div>
  );
}

export function FieldMessage({ id, hint, error }: { id: string; hint?: React.ReactNode; error?: string }) {
  if (error)
    return (
      <p id={`${id}-err`} className="mt-1.5 flex items-start gap-1.5 text-sm text-danger-600" role="alert">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
        {error}
      </p>
    );
  if (hint)
    return (
      <p id={`${id}-hint`} className="mt-1.5 text-sm text-ink-400">
        {hint}
      </p>
    );
  return null;
}

/** Mot de passe affichable en un clic (INS-06). */
export function PasswordField({ label, name, hint, error, ...input }: FieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-900">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          className={cn(inputCls, "pr-12")}
          {...input}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-ink-400 hover:text-forest-900"
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </div>
      <FieldMessage id={id} hint={hint} error={error} />
    </div>
  );
}

export function SelectField({
  label,
  name,
  error,
  children,
  className,
  ...select
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; name: string; error?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-900">
        {label}
      </label>
      <select id={id} name={name} aria-invalid={Boolean(error)} className={cn(inputCls, "appearance-auto")} {...select}>
        {children}
      </select>
      <FieldMessage id={id} error={error} />
    </div>
  );
}

export function SubmitButton({
  children,
  pendingLabel,
  variant = "forest",
  className,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "forest" | "gold" | "outline";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn(buttonVariants({ variant, size: "lg" }), "w-full", className)}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden /> {pendingLabel ?? "Un instant…"}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function FormAlert({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm",
        error ? "bg-danger-600/10 text-danger-600" : "bg-olive-100 text-forest-800",
      )}
    >
      {error ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
      <span>{error ?? success}</span>
    </div>
  );
}

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5", className)} aria-hidden>
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.7-2.8Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4Z" />
    </svg>
  );
}
