"use client";

import { Info } from "lucide-react";
import { INVESTOR_CONTRIBUTIONS, OWNER_CONTRIBUTIONS, SALE_INCLUDED } from "@/lib/lands/draft";
import { Choice, MultiChoice, NumberInput, Question, TextInput, YES_NO, YES_NO_UNKNOWN } from "../controls";
import type { StepProps } from "../types";

const yn = (v: boolean | null) => (v == null ? null : v ? "yes" : "no");
const toOpts = (list: readonly string[]) => list.map((v) => ({ value: v, label: v }));

/** Étape 6 : formulaire selon l'objectif choisi à l'étape 1 (§3.4). */
export function StepOffer({ draft, patch, showErrors, goTo }: StepProps) {
  const o = draft.offer;
  const set = (p: Partial<typeof o>) => patch("offer", p);

  if (!draft.objective)
    return (
      <div className="rounded-xl bg-cream-100 p-5 text-sm text-ink-600">
        Choisissez d&apos;abord votre objectif.{" "}
        <button type="button" onClick={() => goTo(1)} className="font-semibold text-forest-800 underline underline-offset-2">
          Revenir à l&apos;étape 1
        </button>
      </div>
    );

  return (
    <div className="space-y-6">
      {draft.objective === "sale" && (
        <>
          <NumberInput
            label="Prix de vente demandé"
            unit="TND"
            required
            value={o.priceTnd}
            onChange={(v) => set({ priceTnd: v })}
            error={showErrors && o.priceTnd == null ? "Indiquez le prix demandé." : null}
          />
          <Question label="Prix négociable ?" required error={showErrors && !o.negotiable ? "Répondez à cette question." : null}>
            <Choice
              columns={3}
              value={o.negotiable}
              onChange={(v) => set({ negotiable: v })}
              options={[YES_NO_UNKNOWN[0], YES_NO_UNKNOWN[1], { value: "unknown", label: "À discuter" }]}
            />
          </Question>
          <Question label="Que vendez-vous ?">
            <Choice
              value={o.partialSale == null ? null : o.partialSale ? "part" : "all"}
              onChange={(v) => set({ partialSale: v === "part" })}
              options={[
                { value: "all", label: "La totalité du terrain" },
                { value: "part", label: "Une partie seulement" },
              ]}
            />
          </Question>
          <Question label="Éléments inclus dans la vente">
            <MultiChoice value={o.included} onChange={(v) => set({ included: v })} options={toOpts(SALE_INCLUDED)} />
          </Question>
          <TextInput
            label="Disponibilité pour une visite"
            value={o.visitAvailability}
            onChange={(v) => set({ visitAvailability: v })}
            placeholder="Ex. le week-end, sur rendez-vous"
          />
        </>
      )}

      {draft.objective === "rent" && (
        <>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <NumberInput
              label="Loyer demandé"
              unit="TND"
              required
              value={o.rentTnd}
              onChange={(v) => set({ rentTnd: v })}
              error={showErrors && o.rentTnd == null ? "Indiquez le loyer." : null}
            />
            <div className="sm:pt-7">
              <Choice
                columns={3}
                value={o.rentPeriod}
                onChange={(v) => set({ rentPeriod: v })}
                options={[
                  { value: "annuel", label: "/ an" },
                  { value: "mensuel", label: "/ mois" },
                  { value: "autre", label: "Autre" },
                ]}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberInput
              label="Durée minimale souhaitée"
              unit="ans"
              required
              value={o.minDurationYears}
              onChange={(v) => set({ minDurationYears: v })}
              error={showErrors && o.minDurationYears == null ? "Indiquez la durée minimale." : null}
            />
            <NumberInput label="Durée proposée" unit="ans" value={o.proposedDurationYears} onChange={(v) => set({ proposedDurationYears: v })} />
          </div>
          <TextInput label="Conditions et échéances de paiement" value={o.paymentTerms} onChange={(v) => set({ paymentTerms: v })} placeholder="Ex. paiement annuel d'avance" />
          <div className="grid gap-5 sm:grid-cols-2">
            <Question label="Planter de nouveaux arbres autorisé ?">
              <Choice value={yn(o.allowPlanting)} onChange={(v) => set({ allowPlanting: v === "yes" })} options={YES_NO} />
            </Question>
            <Question label="Construire ou installer des équipements autorisé ?">
              <Choice value={yn(o.allowBuilding)} onChange={(v) => set({ allowBuilding: v === "yes" })} options={YES_NO} />
            </Question>
            <Question label="Contrat renouvelable ?">
              <Choice value={yn(o.renewable)} onChange={(v) => set({ renewable: v === "yes" })} options={YES_NO} />
            </Question>
          </div>
          <TextInput label="Conditions d'irrigation et d'entretien" multiline value={o.irrigationTerms} onChange={(v) => set({ irrigationTerms: v })} />
        </>
      )}

      {draft.objective === "partnership" && (
        <>
          <Question label="Type de partenariat" required error={showErrors && !o.partnershipType ? "Choisissez le type de partenariat." : null}>
            <Choice
              value={o.partnershipType}
              onChange={(v) => set({ partnershipType: v })}
              options={[
                { value: "mgharsa", label: "Mgharsa", hint: "Terre contre plantation, répartition convenue" },
                { value: "other", label: "Autre formule" },
              ]}
            />
          </Question>
          <TextInput
            label="Projet agricole souhaité"
            multiline
            value={o.projectDescription}
            onChange={(v) => set({ projectDescription: v })}
            placeholder="Ex. plantation de 2 000 oliviers en irrigué"
          />
          <Question
            label="Votre contribution"
            required
            error={showErrors && !o.ownerContribution.length ? "Choisissez au moins une contribution." : null}
          >
            <MultiChoice value={o.ownerContribution} onChange={(v) => set({ ownerContribution: v })} options={toOpts(OWNER_CONTRIBUTIONS)} />
          </Question>
          <Question
            label="Contribution attendue de l'investisseur"
            required
            error={showErrors && !o.investorContribution.length ? "Choisissez au moins une contribution." : null}
          >
            <MultiChoice value={o.investorContribution} onChange={(v) => set({ investorContribution: v })} options={toOpts(INVESTOR_CONTRIBUTIONS)} />
          </Question>
          <Question label="Participerez-vous au travail et à la gestion ?">
            <Choice value={yn(o.ownerParticipates)} onChange={(v) => set({ ownerParticipates: v === "yes" })} options={YES_NO} />
          </Question>
          <TextInput label="Votre expérience agricole et votre disponibilité" multiline value={o.ownerExperience} onChange={(v) => set({ ownerExperience: v })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberInput
              label="Part souhaitée pour le propriétaire"
              unit="%"
              value={o.ownerSharePct}
              onChange={(v) => set({ ownerSharePct: v })}
              error={o.ownerSharePct != null && (o.ownerSharePct < 0 || o.ownerSharePct > 100) ? "Entre 0 et 100 %." : null}
              hint="Si déjà définie."
            />
            <NumberInput label="Durée envisagée" unit="ans" value={o.durationYears} onChange={(v) => set({ durationYears: v })} />
          </div>
          {o.ownerSharePct != null && o.ownerSharePct >= 0 && o.ownerSharePct <= 100 && (
            <div className="rounded-xl bg-white p-4 ring-1 ring-forest-900/10">
              <p className="text-sm font-semibold text-ink-900">Répartition envisagée</p>
              <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-cream-200" aria-hidden>
                <span className="bg-gold-500" style={{ width: `${o.ownerSharePct}%` }} />
                <span className="flex-1 bg-olive-500" />
              </div>
              <p className="mt-2 flex justify-between text-sm text-ink-600">
                <span>Propriétaire : {o.ownerSharePct} %</span>
                <span>Investisseur : {Math.round((100 - o.ownerSharePct) * 100) / 100} %</span>
              </p>
            </div>
          )}
        </>
      )}

      <TextInput
        label="Informations complémentaires et conditions particulières"
        multiline
        value={o.notes}
        onChange={(v) => set({ notes: v })}
      />

      <div className="flex gap-3 rounded-xl bg-cream-100 p-4 text-sm text-ink-600">
        <Info className="mt-0.5 size-5 shrink-0 text-olive-600" aria-hidden />
        <p>
          VerdOlive présente les conditions souhaitées sans générer de contrat. Les modalités finales doivent être vérifiées et
          formalisées par des professionnels compétents. Les frais VerdOlive vous seront indiqués avant tout engagement.
        </p>
      </div>
    </div>
  );
}
