"use client";

import { AlertCircle, CheckCircle2, Loader2, Pencil, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { GOVERNORATES, delegationId } from "@/lib/data/tunisia";
import { STATUS_LABEL } from "@/lib/domain/ranking";
import { submitLand } from "@/lib/lands/actions";
import { WATER_SOURCES } from "@/lib/lands/draft";
import { cn, formatHa, formatTnd } from "@/lib/utils";
import { DossierGauge } from "../gauge";
import type { StepProps } from "../types";

const OBJECTIVE = { sale: "Vendre", rent: "Louer", partnership: "Trouver un partenaire" } as const;
const TITLE = { yes: "Oui", no: "Non", unknown: "Je ne sais pas" } as const;
const AVAILABILITY = { year_round: "toute l'année", seasonal: "saisonnière", uncertain: "incertaine" } as const;

/** Étape 7 : récapitulatif, complétude, niveau estimé et envoi (§3.1). */
export function StepSummary(props: StepProps) {
  const { draft, ranking, media, goTo, mode, ensureSaved } = props;
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const gov = GOVERNORATES.find((g) => g.id === draft.location.governorateId);
  const delegation = gov?.delegations.find((d) => delegationId(gov.id, d) === draft.location.delegationId);
  const o = draft.offer;

  const offerLine =
    draft.objective === "sale" && o.priceTnd != null
      ? `Prix demandé : ${formatTnd(o.priceTnd)}`
      : draft.objective === "rent" && o.rentTnd != null
        ? `Loyer : ${formatTnd(o.rentTnd)} (${o.rentPeriod})`
        : draft.objective === "partnership" && o.partnershipType
          ? `${o.partnershipType === "mgharsa" ? "Mgharsa" : "Autre formule"}${o.ownerSharePct != null ? `, ${o.ownerSharePct} % propriétaire` : ""}`
          : "Conditions à compléter";

  const rows: { step: number; label: string; value: string }[] = [
    { step: 1, label: "Objectif", value: draft.objective ? OBJECTIVE[draft.objective] : "Non choisi" },
    {
      step: 2,
      label: "Titre foncier",
      value: draft.title.answer
        ? `${TITLE[draft.title.answer]}${draft.title.answer === "yes" && draft.title.number ? ` · n° ${draft.title.number}` : ""}`
        : "Non renseigné",
    },
    {
      step: 2,
      label: "Eau",
      value:
        draft.water.answer === "yes"
          ? `Oui · ${draft.water.sources.map((s) => WATER_SOURCES.find((x) => x.value === s)?.label).join(", ") || "source ?"}${draft.water.availability ? `, ${AVAILABILITY[draft.water.availability]}` : ""}`
          : draft.water.answer === "no"
            ? "Non"
            : "Non renseigné",
    },
    {
      step: 3,
      label: "Localisation",
      value: gov ? `${delegation ? `${delegation}, ` : ""}${gov.fr}${draft.location.areaHa ? ` · ${formatHa(draft.location.areaHa)}` : ""}` : "Non renseignée",
    },
    { step: 4, label: "Arbres", value: draft.land.trees.length ? draft.land.trees.map((t) => `${t.species}${t.count ? ` (${t.count})` : ""}`).join(", ") : "Non renseignés" },
    { step: 5, label: "Photos et documents", value: `${media.photoCount} photo${media.photoCount > 1 ? "s" : ""}, ${media.documentsCount} document${media.documentsCount > 1 ? "s" : ""}` },
    { step: 6, label: "Conditions", value: offerLine },
  ];

  async function submit() {
    setError(null);
    setState("sending");
    if (mode === "demo") {
      await new Promise((r) => setTimeout(r, 600));
      setState(ranking.canSubmit ? "sent" : "idle");
      return;
    }
    const id = await ensureSaved();
    if (!id) {
      setState("idle");
      return setError("Le brouillon n'a pas pu être enregistré.");
    }
    const r = await submitLand(id);
    if (r.ok) setState("sent");
    else {
      setState("idle");
      setError(r.error ?? "Soumission impossible.");
    }
  }

  if (state === "sent")
    return (
      <div className="rounded-card bg-olive-100 p-8 text-center">
        <CheckCircle2 className="mx-auto size-12 text-forest-800" aria-hidden />
        <h3 className="mt-4 font-serif text-3xl font-semibold text-forest-900">Dossier envoyé</h3>
        <p className="mx-auto mt-2 max-w-md text-ink-600">
          L&apos;équipe VerdOlive va examiner votre terrain. Vous serez prévenu à chaque étape : informations à compléter, vérification,
          publication.
        </p>
        <Link href="/espace-porteur" className={cn(buttonVariants({ variant: "forest" }), "mt-6")}>
          Retour à mon espace
        </Link>
      </div>
    );

  return (
    <div className="space-y-6">
      <dl className="divide-y divide-forest-900/10 rounded-card bg-white ring-1 ring-forest-900/10">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
            <dt className="w-32 shrink-0 text-sm text-ink-400 sm:w-44">{r.label}</dt>
            <dd className="flex-1 text-sm font-medium text-ink-900">{r.value}</dd>
            <button
              type="button"
              onClick={() => goTo(r.step)}
              className="grid size-9 shrink-0 place-items-center rounded-full text-forest-800 hover:bg-forest-900/5"
              aria-label={`Modifier : ${r.label}`}
            >
              <Pencil className="size-4" />
            </button>
          </div>
        ))}
      </dl>

      <div className="lg:hidden">
        <DossierGauge ranking={ranking} />
      </div>

      <div className="rounded-card bg-cream-100 p-5">
        <p className="text-sm text-ink-600">
          Niveau de priorité estimé : <strong className="text-ink-900">{STATUS_LABEL[ranking.status]}</strong>
        </p>
        <p className="mt-1 text-sm text-ink-400">{ranking.reason}</p>
        {ranking.titleProof !== "verified" && draft.title.answer === "yes" && (
          <p className="mt-2 text-sm text-ink-600">
            Votre titre sera affiché « Titre déclaré » jusqu&apos;à sa vérification par l&apos;équipe VerdOlive.
          </p>
        )}
      </div>

      {!ranking.canSubmit && (
        <div className="rounded-card border-2 border-danger-600/30 bg-danger-600/5 p-5" role="alert">
          <p className="flex items-center gap-2 font-semibold text-danger-600">
            <AlertCircle className="size-5" aria-hidden /> Avant d&apos;envoyer votre dossier
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-ink-900">
            {ranking.blockingIssues.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-600">Votre brouillon reste enregistré : vous pouvez le compléter plus tard.</p>
        </div>
      )}

      {error && (
        <p className="flex items-start gap-2 rounded-xl bg-danger-600/10 px-4 py-3 text-sm text-danger-600" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!ranking.canSubmit || state === "sending"}
        className={cn(buttonVariants({ variant: "gold", size: "lg" }), "w-full")}
      >
        {state === "sending" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
        Envoyer mon dossier à VerdOlive
      </button>
    </div>
  );
}
