"use client";

import { AlertCircle, Check } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/utils";

/** Champs contrôlés de l'assistant. Grands boutons, utilisables au pouce (TER-08). */

export function Question({
  label,
  help,
  required,
  error,
  children,
  className,
}: {
  label: React.ReactNode;
  help?: React.ReactNode;
  required?: boolean;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="mb-2 text-sm font-semibold text-ink-900">
        {label}
        {required ? (
          <span className="ml-1 text-danger-600" aria-hidden>
            *
          </span>
        ) : (
          <span className="ml-1.5 font-normal text-ink-400">(facultatif)</span>
        )}
      </legend>
      {help && <p className="-mt-1 mb-2 text-sm text-ink-400">{help}</p>}
      {children}
      {error && <ErrorText>{error}</ErrorText>}
    </fieldset>
  );
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 flex items-start gap-1.5 text-sm text-danger-600" role="alert">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}

type Option<T extends string> = { value: T; label: React.ReactNode; hint?: string };

/** Choix unique en grands boutons (Oui / Non… : pas de menu déroulant, §3.2). */
export function Choice<T extends string>({
  value,
  onChange,
  options,
  columns = 2,
  size = "md",
}: {
  value: T | null | undefined;
  onChange: (v: T) => void;
  options: Option<T>[];
  columns?: 2 | 3 | 4;
  size?: "md" | "lg";
}) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "grid gap-2",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-3",
        columns === 4 && "grid-cols-2 sm:grid-cols-4",
      )}
    >
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative flex flex-col items-start justify-center rounded-xl border-2 px-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500",
              size === "lg" ? "min-h-16 py-3 text-lg font-semibold" : "min-h-12 py-2.5 font-medium",
              selected
                ? "border-forest-800 bg-forest-800 text-cream-50"
                : "border-forest-900/12 bg-white text-ink-900 hover:border-forest-900/35",
            )}
          >
            <span>{o.label}</span>
            {o.hint && <span className={cn("mt-0.5 text-xs font-normal", selected ? "text-cream-100/80" : "text-ink-400")}>{o.hint}</span>}
            {selected && <Check className="absolute end-3 top-3 size-4" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}

/** Choix multiple en pastilles. */
export function MultiChoice<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T[];
  onChange: (v: T[]) => void;
  options: Option<T>[];
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group">
      {options.map((o) => {
        const selected = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? value.filter((v) => v !== o.value) : [...value, o.value])}
            className={cn(
              "inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-4 text-sm font-medium transition-colors",
              selected ? "border-forest-800 bg-olive-100 text-forest-900" : "border-forest-900/12 bg-white text-ink-600 hover:border-forest-900/35",
            )}
          >
            {selected && <Check className="size-4" aria-hidden />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const inputCls =
  "block w-full rounded-xl border border-forest-900/15 bg-white px-4 py-3 text-base text-ink-900 placeholder:text-ink-400 focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-500/30 aria-[invalid=true]:border-danger-600";

export function TextInput({
  label,
  value,
  onChange,
  required,
  error,
  hint,
  multiline,
  className,
  ...rest
}: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
  required?: boolean;
  error?: string | null;
  hint?: React.ReactNode;
  multiline?: boolean;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink-900">
        {label}
        {required ? <span className="ml-1 text-danger-600">*</span> : <span className="ml-1.5 font-normal text-ink-400">(facultatif)</span>}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          aria-invalid={Boolean(error)}
          className={inputCls}
          placeholder={rest.placeholder}
        />
      ) : (
        <input id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)} className={inputCls} {...rest} />
      )}
      {error ? <ErrorText>{error}</ErrorText> : hint ? <p className="mt-1.5 text-sm text-ink-400">{hint}</p> : null}
    </div>
  );
}

/** Nombre : la saisie vide donne null, la virgule décimale est acceptée. */
export function NumberInput({
  label,
  value,
  onChange,
  unit,
  required,
  error,
  hint,
  className,
}: {
  label: string;
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  unit?: string;
  required?: boolean;
  error?: string | null;
  hint?: React.ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink-900">
        {label}
        {required ? <span className="ml-1 text-danger-600">*</span> : <span className="ml-1.5 font-normal text-ink-400">(facultatif)</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          defaultValue={value ?? ""}
          onChange={(e) => {
            const raw = e.target.value.replace(/\s/g, "").replace(",", ".");
            if (raw === "") return onChange(null);
            const n = Number(raw);
            if (Number.isFinite(n)) onChange(n);
          }}
          aria-invalid={Boolean(error)}
          className={cn(inputCls, unit && "pr-16")}
        />
        {unit && <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-ink-400">{unit}</span>}
      </div>
      {error ? <ErrorText>{error}</ErrorText> : hint ? <p className="mt-1.5 text-sm text-ink-400">{hint}</p> : null}
    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  required,
  placeholder = "Choisir…",
  disabled,
  error,
  className,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string | null) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  error?: string | null;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink-900">
        {label}
        {required ? <span className="ml-1 text-danger-600">*</span> : <span className="ml-1.5 font-normal text-ink-400">(facultatif)</span>}
      </label>
      <select
        id={id}
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value || null)}
        aria-invalid={Boolean(error)}
        className={cn(inputCls, "disabled:bg-cream-100 disabled:text-ink-400")}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}

/** Bloc qui apparaît selon la réponse (TER-02), sans rechargement. */
export function Reveal({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (!show) return null;
  return <div className="mt-4 space-y-5 rounded-xl border-l-4 border-olive-500 bg-cream-100/70 p-4 sm:p-5">{children}</div>;
}

export const YES_NO = [
  { value: "yes" as const, label: "Oui" },
  { value: "no" as const, label: "Non" },
];
export const YES_NO_UNKNOWN = [
  { value: "yes" as const, label: "Oui" },
  { value: "no" as const, label: "Non" },
  { value: "unknown" as const, label: "Je ne sais pas" },
];
