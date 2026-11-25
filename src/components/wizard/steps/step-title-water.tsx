"use client";

import { Droplets, FileText, HelpCircle, Keyboard } from "lucide-react";
import { useState } from "react";
import { validateTitleNumber } from "@/lib/domain/ranking";
import { WATER_SOURCES } from "@/lib/lands/draft";
import { Choice, ErrorText, MultiChoice, NumberInput, Question, Reveal, TextInput, YES_NO, YES_NO_UNKNOWN } from "../controls";
import type { StepProps } from "../types";

/** Étape 2 : titre foncier et eau, les deux informations qui décident du classement (§3.2). */
export function StepTitleWater({ draft, patch, showErrors }: StepProps) {
  const t = draft.title;
  const w = draft.water;
  const [numericKeyboard, setNumericKeyboard] = useState(false);
  const numberCheck = validateTitleNumber(t.number);
  const err = (cond: boolean, msg: string) => (showErrors && cond ? msg : null);

  return (
    <div className="space-y-10">
      {/* A. Titre foncier */}
      <section aria-labelledby="titre-h">
        <h3 id="titre-h" className="mb-4 flex items-center gap-2 text-lg font-semibold text-forest-900">
          <FileText className="size-5 text-gold-600" aria-hidden /> Titre foncier
        </h3>
        <Question label="Le terrain a-t-il un titre foncier ?" required error={err(!t.answer, "Répondez à cette question.")}>
          <Choice
            size="lg"
            columns={3}
            value={t.answer}
            onChange={(v) => patch("title", { answer: v })}
            options={[
              { value: "yes", label: "Oui" },
              { value: "no", label: "Non" },
              { value: "unknown", label: "Je ne sais pas" },
            ]}
          />
        </Question>

        <Reveal show={t.answer === "yes"}>
          <div>
            <TextInput
              label="Numéro du titre foncier"
              required
              value={t.number}
              onChange={(v) => patch("title", { number: v })}
              inputMode={numericKeyboard ? "numeric" : "text"}
              autoComplete="off"
              maxLength={60}
              placeholder="Ex. 45127/12"
              error={showErrors || t.number ? (numberCheck.ok ? null : numberCheck.warning) : null}
              hint={numberCheck.ok && numberCheck.warning ? numberCheck.warning : "Il figure en haut du titre délivré par la Conservation de la propriété foncière."}
            />
            <button
              type="button"
              onClick={() => setNumericKeyboard((v) => !v)}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-forest-800 underline underline-offset-2"
            >
              <Keyboard className="size-4" aria-hidden />
              {numericKeyboard ? "Revenir au clavier complet" : "Utiliser le clavier numérique"}
            </button>
          </div>
          <TextInput
            label="Conservation foncière ou gouvernorat de rattachement"
            value={t.registry}
            onChange={(v) => patch("title", { registry: v })}
            placeholder="Ex. Nabeul"
          />
          <TextInput
            label="Nom du ou des propriétaires inscrits"
            value={t.ownerNames}
            onChange={(v) => patch("title", { ownerNames: v })}
          />
        </Reveal>

        <Reveal show={t.answer === "no"}>
          <Question label="Quel autre document existe ?" required error={err(!t.altDocument, "Choisissez un document, ou « Aucun ».")}>
            <Choice
              value={t.altDocument}
              onChange={(v) => patch("title", { altDocument: v })}
              options={[
                { value: "adoulaire", label: "Acte adoulaire" },
                { value: "sale_contract", label: "Contrat de vente" },
                { value: "ownership_certificate", label: "Certificat de propriété" },
                { value: "other", label: "Autre document" },
                { value: "none", label: "Aucun" },
              ]}
            />
          </Question>
          <Question label="Le terrain est-il en cours d'immatriculation ?">
            <Choice columns={3} value={t.registrationInProgress} onChange={(v) => patch("title", { registrationInProgress: v })} options={YES_NO_UNKNOWN} />
          </Question>
        </Reveal>

        <Reveal show={t.answer === "unknown"}>
          <div className="flex gap-3 text-sm text-ink-600">
            <HelpCircle className="mt-0.5 size-5 shrink-0 text-gold-600" aria-hidden />
            <div>
              <p className="font-semibold text-ink-900">Où trouver mon numéro de titre foncier ?</p>
              <p className="mt-1">
                Il figure sur le certificat de propriété délivré par la Conservation de la propriété foncière de votre gouvernorat.
                Vous pouvez aussi le demander à la conservation avec le nom du propriétaire et la localisation. Votre dossier est
                enregistré : revenez le compléter dès que vous l&apos;avez.
              </p>
            </div>
          </div>
        </Reveal>

        {t.answer && (
          <div className="mt-6 space-y-5">
            <Question
              label="Nature de la propriété"
              required={t.answer === "yes"}
              error={err(t.answer === "yes" && !t.ownership, "Précisez la nature de la propriété.")}
            >
              <Choice
                columns={3}
                value={t.ownership}
                onChange={(v) => patch("title", { ownership: v, jointOwnersAgree: v === "joint" ? t.jointOwnersAgree : null })}
                options={[
                  { value: "individual", label: "Individuelle" },
                  { value: "joint", label: "Indivision", hint: "Plusieurs propriétaires" },
                  { value: "other", label: "Autre" },
                ]}
              />
            </Question>
            {t.ownership === "joint" && (
              <div>
                <label className="flex items-start gap-3 rounded-xl border-2 border-gold-500/40 bg-gold-100/60 p-4 text-sm text-ink-900">
                  <input
                    type="checkbox"
                    checked={Boolean(t.jointOwnersAgree)}
                    onChange={(e) => patch("title", { jointOwnersAgree: e.target.checked })}
                    className="mt-0.5 size-5 shrink-0 accent-forest-800"
                  />
                  <span>
                    <strong>Je confirme que tous les indivisaires sont d&apos;accord</strong> pour proposer ce terrain sur VerdOlive.
                    <span className="mt-1 block text-ink-600">Vous pourrez joindre un document d&apos;accord à l&apos;étape 5.</span>
                  </span>
                </label>
                {showErrors && !t.jointOwnersAgree && <ErrorText>Cette confirmation est obligatoire pour une propriété en indivision.</ErrorText>}
              </div>
            )}
          </div>
        )}
      </section>

      {/* B. Eau */}
      <section aria-labelledby="eau-h">
        <h3 id="eau-h" className="mb-4 flex items-center gap-2 text-lg font-semibold text-forest-900">
          <Droplets className="size-5 text-sky-700" aria-hidden /> Eau
        </h3>
        <Question label="L'eau est-elle disponible sur le terrain ?" required error={err(!w.answer, "Répondez à cette question.")}>
          <Choice size="lg" value={w.answer} onChange={(v) => patch("water", { answer: v })} options={YES_NO} />
        </Question>

        <Reveal show={w.answer === "yes"}>
          <Question label="Source d'eau" help="Plusieurs choix possibles." required error={err(!w.sources.length, "Choisissez au moins une source.")}>
            <MultiChoice value={w.sources} onChange={(v) => patch("water", { sources: v })} options={[...WATER_SOURCES]} />
          </Question>
          <Question label="Disponibilité dans l'année" required error={err(!w.availability, "Précisez la disponibilité.")}>
            <Choice
              columns={3}
              value={w.availability}
              onChange={(v) => patch("water", { availability: v })}
              options={[
                { value: "year_round", label: "Toute l'année" },
                { value: "seasonal", label: "Saisonnière" },
                { value: "uncertain", label: "Incertaine" },
              ]}
            />
          </Question>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <NumberInput
              label="Débit"
              value={w.flowValue}
              onChange={(v) => patch("water", { flowValue: v })}
              hint="Quantité d'eau donnée par la source. l/s : litres par seconde ; m³/h : mètres cubes par heure (1 l/s = 3,6 m³/h). Exemple : un bidon de 100 litres rempli en 25 secondes donne 4 l/s. Facultatif, mais il améliore la position de votre terrain."
            />
            <div className="sm:pt-7">
              <Choice
                value={w.flowUnit}
                onChange={(v) => patch("water", { flowUnit: v })}
                options={[
                  { value: "l_s", label: "l/s" },
                  { value: "m3_h", label: "m³/h" },
                ]}
              />
            </div>
          </div>
          {w.flowValue != null && (
            <Question label="Comment ce débit a-t-il été obtenu ?">
              <Choice
                value={w.flowMeasured == null ? null : w.flowMeasured ? "measured" : "declared"}
                onChange={(v) => patch("water", { flowMeasured: v === "measured" })}
                options={[
                  { value: "measured", label: "Mesuré", hint: "Essai de pompage, compteur…" },
                  { value: "declared", label: "Estimé", hint: "Connaissance du terrain" },
                ]}
              />
            </Question>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberInput label="Profondeur du puits ou du forage" unit="m" value={w.depthM} onChange={(v) => patch("water", { depthM: v })} />
            <NumberInput label="Salinité de l'eau" unit="g/l" value={w.salinityGL} onChange={(v) => patch("water", { salinityGL: v })} />
          </div>
          <TextInput
            label="Autorisation ou déclaration du puits / forage"
            value={w.permit}
            onChange={(v) => patch("water", { permit: v })}
            placeholder="Ex. autorisation CRDA n°…"
          />
          <TextInput
            label="Équipements existants"
            multiline
            value={w.equipment}
            onChange={(v) => patch("water", { equipment: v })}
            placeholder="Pompe, bassin, goutte-à-goutte… et leur état"
          />
          <Question label="L'eau est-elle partagée avec d'autres exploitants ?" help="Voisins, groupement…">
            <Choice columns={3} value={w.shared} onChange={(v) => patch("water", { shared: v })} options={YES_NO_UNKNOWN} />
          </Question>
          {w.shared === "yes" && (
            <TextInput
              label="Comment l'eau est-elle partagée ?"
              required
              multiline
              value={w.sharedDetails}
              onChange={(v) => patch("water", { sharedDetails: v })}
              placeholder="Usages, tours d'eau, accords existants…"
              error={err(!w.sharedDetails?.trim(), "Décrivez le partage de l'eau.")}
            />
          )}
        </Reveal>

        <Reveal show={w.answer === "no"}>
          <Question label="Une source d'eau existe-t-elle à proximité ?" required error={err(!w.nearbySource, "Répondez à cette question.")}>
            <Choice columns={3} value={w.nearbySource} onChange={(v) => patch("water", { nearbySource: v })} options={YES_NO_UNKNOWN} />
          </Question>
          {w.nearbySource === "yes" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label="Type de source" value={w.nearbyType} onChange={(v) => patch("water", { nearbyType: v })} placeholder="Ex. forage du voisin, oued" />
              <NumberInput label="Distance approximative" unit="km" value={w.nearbyDistanceKm} onChange={(v) => patch("water", { nearbyDistanceKm: v })} />
            </div>
          )}
          <Question label="Une culture pluviale (sans irrigation) est-elle envisagée ?">
            <Choice
              value={w.rainfed == null ? null : w.rainfed ? "yes" : "no"}
              onChange={(v) => patch("water", { rainfed: v === "yes" })}
              options={YES_NO}
            />
          </Question>
        </Reveal>
      </section>
    </div>
  );
}
