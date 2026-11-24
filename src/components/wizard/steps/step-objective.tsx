"use client";

import { Handshake, KeyRound, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { ErrorText, TextInput } from "../controls";
import type { StepProps } from "../types";

const OBJECTIVES = [
  { value: "sale", title: "Vendre mon terrain", text: "Publier une offre de vente et recevoir des demandes d'acheteurs.", icon: Tag },
  { value: "rent", title: "Louer mon terrain", text: "Proposer le terrain à la location pour une exploitation agricole.", icon: KeyRound },
  {
    value: "partnership",
    title: "Trouver un partenaire",
    text: "Valoriser le terrain avec un investisseur, par exemple en Mgharsa, sans forcément vendre ni louer.",
    icon: Handshake,
  },
] as const;

/** Étape 1 : l'objectif détermine le formulaire de l'étape 6 (§3.4). */
export function StepObjective({ draft, setRoot, showErrors }: StepProps) {
  return (
    <div className="space-y-6">
      <div role="radiogroup" aria-label="Votre objectif" className="grid gap-3">
        {OBJECTIVES.map(({ value, title, text, icon: Icon }) => {
          const selected = draft.objective === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setRoot({ objective: value })}
              className={cn(
                "flex items-start gap-4 rounded-card border-2 p-5 text-left transition-colors",
                selected ? "border-forest-800 bg-olive-100/60" : "border-forest-900/10 bg-white hover:border-forest-900/30",
              )}
            >
              <span
                className={cn(
                  "grid size-12 shrink-0 place-items-center rounded-full",
                  selected ? "bg-forest-800 text-cream-50" : "bg-olive-100 text-forest-800",
                )}
              >
                <Icon className="size-6" aria-hidden />
              </span>
              <span>
                <span className="block text-lg font-semibold text-ink-900">{title}</span>
                <span className="mt-1 block text-sm text-ink-600">{text}</span>
              </span>
            </button>
          );
        })}
      </div>
      {showErrors && !draft.objective && <ErrorText>Choisissez votre objectif pour continuer.</ErrorText>}

      <TextInput
        label="Nom de l'annonce"
        value={draft.name}
        onChange={(v) => setRoot({ name: v })}
        placeholder="Ex. Oliveraie familiale à Korba"
        hint="Un nom court qui décrit votre terrain. Vous pourrez le modifier."
        maxLength={120}
      />
    </div>
  );
}
