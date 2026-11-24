"use client";

import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { reviewDocument, saveSettings, setFeeNote, setLandStatus, setWaterProof, verifyTitle, type AdminResult } from "@/lib/admin/actions";
import { SORT_CRITERION_LABEL, type SortCriterion } from "@/lib/domain/ranking";
import { WORKFLOW_LABEL } from "@/lib/lands/labels";
import { cn } from "@/lib/utils";

const btn = "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors disabled:opacity-50";
const field = "w-full rounded-xl border border-forest-900/15 bg-white px-3 py-2 text-sm focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-500/30";

function useAction() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (fn: () => Promise<AdminResult>, success = "Enregistré.") =>
    start(async () => {
      const r = await fn();
      setMsg({ ok: r.ok, text: r.ok ? success : (r.error ?? "Erreur.") });
    });
  const Msg = () => (msg ? <p className={cn("text-sm", msg.ok ? "text-forest-800" : "text-danger-600")} role="status">{msg.text}</p> : null);
  return { pending, run, Msg };
}

const QUICK: { status: string; label: string; cls: string; needsNote?: boolean }[] = [
  { status: "info_requested", label: "Demander des informations", cls: "bg-gold-100 text-forest-900 hover:bg-gold-400", needsNote: true },
  { status: "title_review", label: "Vérification foncière", cls: "bg-white ring-1 ring-forest-900/15 hover:ring-forest-900/40" },
  { status: "validation", label: "Validation", cls: "bg-white ring-1 ring-forest-900/15 hover:ring-forest-900/40" },
  { status: "published", label: "Publier", cls: "bg-forest-900 text-cream-50 hover:bg-forest-800" },
  { status: "suspended", label: "Suspendre", cls: "bg-white ring-1 ring-forest-900/15 hover:ring-forest-900/40" },
  { status: "rejected", label: "Refuser", cls: "bg-danger-600/10 text-danger-600 hover:bg-danger-600/20", needsNote: true },
];

/** §10 / scénario 12 : faire avancer le dossier, avec une note envoyée au porteur. */
export function StatusPanel({ landId, status, canPublish }: { landId: string; status: string; canPublish: boolean }) {
  const [note, setNote] = useState("");
  const [other, setOther] = useState("");
  const { pending, run, Msg } = useAction();
  return (
    <div className="space-y-3">
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={field} placeholder="Note pour le porteur (envoyée avec la notification)" />
      <div className="flex flex-wrap gap-2">
        {QUICK.filter((q) => q.status !== status).map((q) => (
          <button
            key={q.status}
            type="button"
            disabled={pending || (q.status === "published" && !canPublish) || (q.needsNote && !note.trim())}
            title={q.needsNote && !note.trim() ? "Ajoutez une note pour le porteur" : q.status === "published" && !canPublish ? "Dossier « À compléter » : publication impossible" : undefined}
            onClick={() => run(() => setLandStatus(landId, q.status, note), `Statut : ${WORKFLOW_LABEL[q.status as keyof typeof WORKFLOW_LABEL]}.`)}
            className={cn(btn, q.cls)}
          >
            {q.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select value={other} onChange={(e) => setOther(e.target.value)} className={cn(field, "w-auto")} aria-label="Autre statut">
          <option value="">Autre statut…</option>
          {Object.entries(WORKFLOW_LABEL)
            .filter(([k]) => k !== "draft" && k !== status)
            .map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
        </select>
        <button type="button" disabled={!other || pending} onClick={() => run(() => setLandStatus(landId, other, note))} className={cn(btn, "bg-white ring-1 ring-forest-900/15")}>
          Appliquer
        </button>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      </div>
      <Msg />
    </div>
  );
}

/** CLA-05 : seul l'admin passe un titre de « déclaré » à « vérifié ». */
export function TitleVerification({ landId, verified, notes, hasTitle }: { landId: string; verified: boolean; notes: string | null; hasTitle: boolean }) {
  const [text, setText] = useState(notes ?? "");
  const { pending, run, Msg } = useAction();
  if (!hasTitle) return <p className="text-sm text-ink-600">Terrain déclaré sans titre foncier : pas de vérification de titre.</p>;
  return (
    <div className="space-y-2">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} className={field} placeholder="Pièces consultées, réserves éventuelles (visibles sur la fiche)" />
      <div className="flex flex-wrap gap-2">
        {!verified ? (
          <button type="button" disabled={pending} onClick={() => run(() => verifyTitle(landId, true, text), "Titre marqué comme vérifié.")} className={cn(btn, "bg-forest-900 text-cream-50")}>
            Marquer « Titre vérifié »
          </button>
        ) : (
          <>
            <button type="button" disabled={pending} onClick={() => run(() => verifyTitle(landId, true, text))} className={cn(btn, "bg-white ring-1 ring-forest-900/15")}>
              Mettre à jour les réserves
            </button>
            <button type="button" disabled={pending} onClick={() => run(() => verifyTitle(landId, false, text), "Vérification retirée.")} className={cn(btn, "bg-danger-600/10 text-danger-600")}>
              Retirer la vérification
            </button>
          </>
        )}
      </div>
      <Msg />
    </div>
  );
}

export function WaterVerification({ landId, proof, hasWater }: { landId: string; proof: string; hasWater: boolean }) {
  const { pending, run, Msg } = useAction();
  if (!hasWater) return <p className="text-sm text-ink-600">Terrain déclaré sans eau.</p>;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Preuve de l'eau">
        {(
          [
            ["declared", "Eau déclarée"],
            ["documented", "Eau documentée"],
            ["analyzed", "Eau analysée"],
          ] as const
        ).map(([v, l]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={proof === v}
            disabled={pending || proof === v}
            onClick={() => run(() => setWaterProof(landId, v))}
            className={cn(btn, proof === v ? "bg-sky-800 text-white disabled:opacity-100" : "bg-white ring-1 ring-forest-900/15")}
          >
            {l}
          </button>
        ))}
      </div>
      <Msg />
    </div>
  );
}

export function DocumentReview({ id, status }: { id: string; status: string }) {
  const { pending, run, Msg } = useAction();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "accepted" && (
        <button type="button" disabled={pending} onClick={() => run(() => reviewDocument(id, "accepted"), "Pièce acceptée.")} className={cn(btn, "min-h-8 bg-olive-100 px-3 text-forest-900")}>
          Accepter
        </button>
      )}
      {status !== "refused" && (
        <button type="button" disabled={pending} onClick={() => run(() => reviewDocument(id, "refused"), "Pièce refusée.")} className={cn(btn, "min-h-8 bg-danger-600/10 px-3 text-danger-600")}>
          Refuser
        </button>
      )}
      <Msg />
    </div>
  );
}

export function FeeNoteForm({ landId, value }: { landId: string; value: string | null }) {
  const [text, setText] = useState(value ?? "");
  const { pending, run, Msg } = useAction();
  return (
    <div className="space-y-2">
      <input value={text} onChange={(e) => setText(e.target.value)} className={field} placeholder="Ex. Commission de 3 % à la signature, payée par l'acheteur" maxLength={500} />
      <button type="button" disabled={pending} onClick={() => run(() => setFeeNote(landId, text))} className={cn(btn, "bg-white ring-1 ring-forest-900/15")}>
        Enregistrer les frais
      </button>
      <Msg />
    </div>
  );
}

/** D4 et CLA-04 : affichage du cas D et ordre du tri « Recommandés ». */
export function SettingsForm({ showLow, order }: { showLow: boolean; order: SortCriterion[] }) {
  const [low, setLow] = useState(showLow);
  const [list, setList] = useState(order);
  const { pending, run, Msg } = useAction();
  const move = (i: number, d: -1 | 1) => {
    const next = [...list];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setList(next);
  };
  return (
    <div className="space-y-6">
      <label className="flex items-start gap-3 rounded-card bg-white p-5 ring-1 ring-forest-900/10">
        <input type="checkbox" checked={low} onChange={(e) => setLow(e.target.checked)} className="mt-0.5 size-5 accent-forest-800" />
        <span>
          <span className="block font-semibold text-ink-900">Afficher par défaut les terrains sans titre ni eau</span>
          <span className="text-sm text-ink-600">Par défaut, ils sont masqués et l&apos;investisseur peut les afficher avec un filtre (décision D4).</span>
        </span>
      </label>
      <div className="rounded-card bg-white p-5 ring-1 ring-forest-900/10">
        <p className="font-semibold text-ink-900">Ordre du tri « Recommandés »</p>
        <p className="text-sm text-ink-600">Chaque critère départage les égalités du précédent (§5.2).</p>
        <ol className="mt-4 space-y-2">
          {list.map((c, i) => (
            <li key={c} className="flex items-center gap-3 rounded-xl bg-cream-100 px-3 py-2">
              <span className="w-5 text-sm font-semibold text-ink-400">{i + 1}</span>
              <span className="flex-1 text-sm text-ink-900">{SORT_CRITERION_LABEL[c]}</span>
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="grid size-8 place-items-center rounded-full hover:bg-white disabled:opacity-30" aria-label={`Monter ${SORT_CRITERION_LABEL[c]}`}>
                <ArrowUp className="size-4" />
              </button>
              <button type="button" disabled={i === list.length - 1} onClick={() => move(i, 1)} className="grid size-8 place-items-center rounded-full hover:bg-white disabled:opacity-30" aria-label={`Descendre ${SORT_CRITERION_LABEL[c]}`}>
                <ArrowDown className="size-4" />
              </button>
            </li>
          ))}
        </ol>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" disabled={pending} onClick={() => run(() => saveSettings({ showLowByDefault: low, sortOrder: list }))} className={cn(btn, "bg-forest-900 text-cream-50")}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />} Enregistrer les réglages
        </button>
        <Msg />
      </div>
    </div>
  );
}
