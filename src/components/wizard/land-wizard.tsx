"use client";

import { ArrowLeft, ArrowRight, Check, CloudOff, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { computeRanking } from "@/lib/domain/ranking";
import { saveDraft } from "@/lib/lands/actions";
import { emptyDraft, NO_MEDIA, toRankingInput, type DraftMedia, type LandDraft } from "@/lib/lands/draft";
import { cn } from "@/lib/utils";
import { DossierGauge } from "./gauge";
import { StepLand } from "./steps/step-land";
import { StepLocation } from "./steps/step-location";
import { StepMedia } from "./steps/step-media";
import { StepObjective } from "./steps/step-objective";
import { StepOffer } from "./steps/step-offer";
import { StepSummary } from "./steps/step-summary";
import { StepTitleWater } from "./steps/step-title-water";
import type { Section, StepProps } from "./types";

const STEPS = [
  { title: "Votre objectif", short: "Objectif", intro: "Que souhaitez-vous faire de votre terrain ?", component: StepObjective },
  {
    title: "Titre foncier et eau",
    short: "Titre et eau",
    intro: "Les deux informations essentielles : elles décident de la place de votre terrain dans le catalogue.",
    component: StepTitleWater,
  },
  { title: "Localisation et superficie", short: "Localisation", intro: "Où se trouve le terrain et quelle est sa taille ?", component: StepLocation },
  { title: "État du terrain", short: "Terrain", intro: "Arbres, constructions et cultures.", component: StepLand },
  { title: "Photos et documents", short: "Photos", intro: "Des photos et des pièces rendent votre dossier plus convaincant.", component: StepMedia },
  { title: "Vos conditions", short: "Conditions", intro: "Les conditions de votre offre.", component: StepOffer },
  { title: "Récapitulatif et envoi", short: "Envoi", intro: "Vérifiez votre dossier avant de l'envoyer.", component: StepSummary },
] as const;

type SaveState = "idle" | "saving" | "saved" | "error";

export interface LandWizardProps {
  mode: "live" | "demo";
  landId?: string | null;
  landRef?: string | null;
  initialDraft?: LandDraft;
  initialStep?: number;
  initialMedia?: DraftMedia;
}

/** Assistant « Ajouter mon terrain » en 7 étapes (§3.1), brouillon enregistré à chaque étape (TER-05). */
export function LandWizard({ mode, landId: initialId = null, landRef = null, initialDraft, initialStep = 1, initialMedia = NO_MEDIA }: LandWizardProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<LandDraft>(() => initialDraft ?? emptyDraft());
  const [step, setStep] = useState(Math.min(7, Math.max(1, initialStep)));
  const [landId, setLandId] = useState<string | null>(initialId);
  const [ref, setRef] = useState<string | null>(landRef);
  const [media, setMedia] = useState<DraftMedia>(initialMedia);
  const [showErrors, setShowErrors] = useState<Record<number, boolean>>({});
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const dirty = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Jauge en direct (TER-06) : même moteur que le serveur.
  const ranking = useMemo(() => computeRanking(toRankingInput(draft, media)), [draft, media]);

  const patch = useCallback(<K extends Section>(section: K, p: Partial<LandDraft[K]>) => {
    dirty.current = true;
    setDraft((d) => ({ ...d, [section]: { ...d[section], ...p } }));
  }, []);
  const setRoot = useCallback((p: Partial<Pick<LandDraft, "objective" | "name">>) => {
    dirty.current = true;
    setDraft((d) => ({ ...d, ...p }));
  }, []);

  const save = useCallback(
    async (targetStep: number): Promise<string | null> => {
      if (mode === "demo") {
        setSaveState("saved");
        dirty.current = false;
        return "demo";
      }
      setSaveState("saving");
      const r = await saveDraft({ landId, step: targetStep, draft });
      if (!r.ok || !r.landId) {
        setSaveState("error");
        setSaveError(r.error ?? "Enregistrement impossible.");
        return landId;
      }
      dirty.current = false;
      setSaveState("saved");
      setSaveError(null);
      if (r.media) setMedia(r.media);
      if (!landId) {
        setLandId(r.landId);
        setRef(r.ref ?? null);
        // L'adresse change sans recharger : le brouillon peut être repris depuis n'importe quel appareil.
        window.history.replaceState(null, "", `/espace-porteur/terrains/${r.landId}`);
      }
      return r.landId;
    },
    [mode, landId, draft],
  );

  // Filet de sécurité : enregistrement 4 s après la dernière modification.
  useEffect(() => {
    if (!dirty.current || mode === "demo" || !landId) return;
    const t = setTimeout(() => void save(step), 4000);
    return () => clearTimeout(t);
  }, [draft, save, step, mode, landId]);

  // Avertit avant de quitter la page avec des modifications non enregistrées.
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty.current && mode === "live") e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [mode]);

  async function goTo(target: number) {
    const next = Math.min(7, Math.max(1, target));
    if (next === step) return;
    if (next > step) setShowErrors((s) => ({ ...s, [step]: true }));
    if (step === 1 && !draft.objective && next > step) return; // l'objectif conditionne la suite
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
    requestAnimationFrame(() => headingRef.current?.focus());
    await save(next);
  }

  const current = STEPS[step - 1];
  const Step = current.component;
  const stepProps: StepProps = {
    draft,
    patch,
    setRoot,
    showErrors: Boolean(showErrors[step]),
    ranking,
    media,
    setMedia,
    landId,
    mode,
    goTo,
    ensureSaved: () => save(step),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12">
      {/* Barre de progression */}
      <nav aria-label="Étapes" className="mb-6">
        <div className="flex items-center justify-between text-sm">
          <p className="font-medium text-ink-900">
            Étape {step} sur 7 <span className="text-ink-400">· {current.short}</span>
          </p>
          <SaveIndicator state={saveState} error={saveError} mode={mode} refCode={ref} />
        </div>
        <ol className="mt-3 grid grid-cols-7 gap-1.5">
          {STEPS.map((s, i) => (
            <li key={s.short}>
              <button
                type="button"
                onClick={() => goTo(i + 1)}
                aria-current={i + 1 === step ? "step" : undefined}
                aria-label={`Étape ${i + 1} : ${s.title}`}
                className={cn(
                  "block h-2 w-full rounded-full transition-colors",
                  i + 1 < step ? "bg-forest-800" : i + 1 === step ? "bg-gold-500" : "bg-cream-200 hover:bg-cream-200/70",
                )}
              />
              <span className={cn("mt-1.5 hidden text-xs lg:block", i + 1 === step ? "font-semibold text-forest-900" : "text-ink-400")}>
                {s.short}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-labelledby="step-title">
          <h1 id="step-title" ref={headingRef} tabIndex={-1} className="font-serif text-3xl font-semibold text-forest-900 outline-none sm:text-4xl">
            {current.title}
          </h1>
          <p className="mt-2 text-ink-600">{current.intro}</p>
          <div className="mt-8">
            <Step {...stepProps} />
          </div>

          {step < 7 && (
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-forest-900/10 bg-cream-50/95 px-4 py-3 backdrop-blur lg:static lg:mt-10 lg:border-0 lg:bg-transparent lg:p-0">
              <div className="mx-auto flex max-w-6xl items-center gap-3">
                {step > 1 && (
                  <button type="button" onClick={() => goTo(step - 1)} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-5")}>
                    <ArrowLeft className="size-4" aria-hidden />
                    <span className="sr-only sm:not-sr-only">Précédent</span>
                  </button>
                )}
                <button type="button" onClick={() => goTo(step + 1)} className={cn(buttonVariants({ variant: "forest", size: "lg" }), "flex-1 lg:flex-none")}>
                  Suivant <ArrowRight className="size-4" aria-hidden />
                </button>
                {mode === "live" && (
                  <button
                    type="button"
                    onClick={async () => {
                      await save(step);
                      router.push("/espace-porteur");
                    }}
                    className="ml-auto hidden text-sm font-medium text-forest-800 underline underline-offset-2 sm:block"
                  >
                    Enregistrer et quitter
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <DossierGauge ranking={ranking} />
          </div>
        </aside>
      </div>

      {/* Jauge compacte sur téléphone (sauf au récapitulatif, qui l'affiche en entier) */}
      {step < 7 && (
        <div className="mt-8 lg:hidden">
          <DossierGauge ranking={ranking} compact />
        </div>
      )}
    </div>
  );
}

function SaveIndicator({ state, error, mode, refCode }: { state: SaveState; error: string | null; mode: "live" | "demo"; refCode: string | null }) {
  if (mode === "demo") return <span className="rounded-full bg-gold-100 px-2.5 py-1 text-xs font-medium text-gold-600">Prévisualisation</span>;
  return (
    <span className="flex items-center gap-1.5 text-xs text-ink-400" role="status">
      {state === "saving" && (
        <>
          <Loader2 className="size-3.5 animate-spin" aria-hidden /> Enregistrement…
        </>
      )}
      {state === "saved" && (
        <>
          <Check className="size-3.5 text-olive-600" aria-hidden /> Brouillon enregistré{refCode ? ` · ${refCode}` : ""}
        </>
      )}
      {state === "error" && (
        <span className="flex items-center gap-1.5 text-danger-600" title={error ?? undefined}>
          <CloudOff className="size-3.5" aria-hidden /> {error ?? "Non enregistré"}
        </span>
      )}
      {state === "idle" && (
        <>
          <Save className="size-3.5" aria-hidden /> Enregistrement automatique
        </>
      )}
    </span>
  );
}
