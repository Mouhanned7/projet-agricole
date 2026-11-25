"use client";

import { Plus, Trash2 } from "lucide-react";
import { EQUIPMENT, PRACTICES, SOIL_TYPES } from "@/lib/lands/draft";
import { Choice, MultiChoice, NumberInput, Question, Select, TextInput } from "../controls";
import type { StepProps } from "../types";

const COMMON_SPECIES = ["Olivier", "Amandier", "Palmier dattier", "Figuier", "Grenadier", "Agrumes", "Pistachier"];

/** Étape 4 : état du terrain, arbres et constructions (§3.3). */
export function StepLand({ draft, patch }: StepProps) {
  const l = draft.land;
  const setTree = (i: number, p: Partial<(typeof l.trees)[number]>) =>
    patch("land", { trees: l.trees.map((t, j) => (j === i ? { ...t, ...p } : t)) });

  return (
    <div className="space-y-7">
      <Question label="État du terrain">
        <Choice
          columns={3}
          value={l.state}
          onChange={(v) => patch("land", { state: v })}
          options={[
            { value: "exploited", label: "Exploité" },
            { value: "partial", label: "Partiellement exploité" },
            { value: "abandoned", label: "Abandonné" },
          ]}
        />
      </Question>

      <Question label="Arbres présents" help="Espèce, nombre approximatif, âge ou état si vous les connaissez.">
        <div className="space-y-3">
          {l.trees.map((t, i) => (
            <div key={`${i}-${l.trees.length}`} className="grid grid-cols-[1fr_auto] gap-3 rounded-xl bg-cream-100/70 p-3 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end">
              <TextInput label="Espèce" value={t.species} onChange={(v) => setTree(i, { species: v })} list="especes" className="col-span-2 sm:col-span-1" />
              <NumberInput label="Nombre" value={t.count} onChange={(v) => setTree(i, { count: v })} />
              <TextInput label="Âge ou état" value={t.age} onChange={(v) => setTree(i, { age: v })} placeholder="Ex. 30 ans" />
              <button
                type="button"
                onClick={() => patch("land", { trees: l.trees.filter((_, j) => j !== i) })}
                className="col-start-2 row-start-2 grid size-11 place-items-center self-end rounded-full text-ink-400 hover:bg-danger-600/10 hover:text-danger-600 sm:col-start-auto sm:row-start-auto"
                aria-label={`Retirer ${t.species || "cette ligne"}`}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <datalist id="especes">
            {COMMON_SPECIES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          {l.trees.length < 20 && (
            <button
              type="button"
              onClick={() => patch("land", { trees: [...l.trees, { species: l.trees.length ? "" : "Olivier", count: null, age: null }] })}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-dashed border-forest-900/20 px-4 text-sm font-medium text-forest-800 hover:border-gold-500"
            >
              <Plus className="size-4" aria-hidden /> Ajouter des arbres
            </button>
          )}
        </div>
      </Question>

      <TextInput
        label="Constructions et installations"
        multiline
        value={l.buildings}
        onChange={(v) => patch("land", { buildings: v })}
        placeholder="Bâtiment, hangar, clôture, bassin…"
      />
      <TextInput
        label="Cultures actuelles ou anciennes"
        value={l.crops}
        onChange={(v) => patch("land", { crops: v })}
        placeholder="Ex. céréales, maraîchage"
      />
      <Select label="Type de sol" value={l.soilType} onChange={(v) => patch("land", { soilType: v })} options={SOIL_TYPES.map((v) => ({ value: v, label: v }))} />
      <TextInput label="Analyses de sol déjà réalisées" multiline value={l.soilAnalyses} onChange={(v) => patch("land", { soilAnalyses: v })} />
      <Question label="Équipements existants">
        <MultiChoice value={l.equipment} onChange={(v) => patch("land", { equipment: v })} options={EQUIPMENT.map((v) => ({ value: v, label: v }))} />
      </Question>
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberInput label="Valeur des arbres" unit="TND" value={l.treesValueTnd} onChange={(v) => patch("land", { treesValueTnd: v })} />
        <NumberInput label="Valeur des constructions" unit="TND" value={l.buildingsValueTnd} onChange={(v) => patch("land", { buildingsValueTnd: v })} />
        <NumberInput label="Travaux nécessaires" unit="TND" value={l.worksTnd} onChange={(v) => patch("land", { worksTnd: v })} />
      </div>
      <TextInput label="Exploitation agricole actuelle" multiline value={l.currentOperation} onChange={(v) => patch("land", { currentOperation: v })} />
      <Question label="Pratiques durables déclarées">
        <MultiChoice value={l.practices} onChange={(v) => patch("land", { practices: v })} options={PRACTICES.map((v) => ({ value: v, label: v }))} />
      </Question>
      <TextInput label="Variétés et savoir-faire locaux" multiline value={l.localKnowledge} onChange={(v) => patch("land", { localKnowledge: v })} />
      <NumberInput label="Emplois locaux prévus" value={l.localJobs} onChange={(v) => patch("land", { localJobs: v })} />

      <TextInput
        label="Description libre"
        multiline
        value={l.description}
        onChange={(v) => patch("land", { description: v })}
        placeholder="Accès, voisinage, histoire du terrain, ce qui le rend intéressant…"
      />
    </div>
  );
}
