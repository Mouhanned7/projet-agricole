"use client";

import { CalendarCheck, CheckCircle2, Flag, Heart, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { buttonVariants } from "@/components/ui/button";
import { acceptCharter, reportProblem, requestVisit, toggleFavorite } from "@/lib/investor/actions";
import { cn } from "@/lib/utils";

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-card bg-cream-50 p-0 text-ink-900 shadow-2xl backdrop:bg-forest-950/50"
    >
      <div className="flex items-center justify-between border-b border-forest-900/10 px-5 py-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-forest-900/5" aria-label="Fermer">
          <X className="size-5" />
        </button>
      </div>
      <div className="max-h-[75vh] overflow-y-auto px-5 py-5">{children}</div>
    </dialog>
  );
}

export function FavoriteButton({ landId, initial, loggedIn }: { landId: string; initial: boolean; loggedIn: boolean }) {
  const [fav, setFav] = useState(initial);
  const [pending, start] = useTransition();
  if (!loggedIn)
    return (
      <Link href={`/connexion?next=/terrains/${landId}`} className={cn(buttonVariants({ variant: "outline" }), "bg-white")}>
        <Heart className="size-4" aria-hidden /> Enregistrer
      </Link>
    );
  return (
    <button
      type="button"
      aria-pressed={fav}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await toggleFavorite(landId);
          if (r.ok) setFav(Boolean(r.favorite));
        })
      }
      className={cn(buttonVariants({ variant: "outline" }), "bg-white")}
    >
      <Heart className={cn("size-4", fav && "fill-danger-600 text-danger-600")} aria-hidden />
      {fav ? "Enregistré" : "Enregistrer"}
    </button>
  );
}

const CHARTER = [
  "Respecter les droits fonciers des propriétaires et des indivisaires, et ne conclure aucun accord sans droits clairs.",
  "Respecter l'accès à l'eau des voisins et des groupements, et éviter la surexploitation des ressources.",
  "Associer les communautés locales et privilégier l'emploi et les prestataires locaux.",
  "Préserver le sol, l'eau et la biodiversité, et choisir des cultures adaptées au terrain.",
  "Partager la valeur de façon transparente et respecter les engagements pris.",
];

/** Demande de visite (scénarios 14 et 19), précédée de la charte (RES-01). */
export function VisitRequest({
  landId,
  loggedIn,
  charterAccepted,
  emailVerified,
}: {
  landId: string;
  loggedIn: boolean;
  charterAccepted: boolean;
  emailVerified: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [charter, setCharter] = useState(charterAccepted);
  const [agree, setAgree] = useState(false);
  const [message, setMessage] = useState("");
  const [dates, setDates] = useState("");
  const [state, setState] = useState<"idle" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!loggedIn)
    return (
      <Link href={`/inscription?profil=investisseur`} className={cn(buttonVariants({ variant: "gold", size: "lg" }), "w-full")}>
        <CalendarCheck className="size-4" aria-hidden /> Demander une visite
      </Link>
    );

  const send = () =>
    start(async () => {
      setError(null);
      if (!charter) {
        const c = await acceptCharter();
        if (!c.ok) return setError(c.error ?? "Erreur.");
        setCharter(true);
      }
      const r = await requestVisit({ landId, message, dates });
      if (r.ok) setState("sent");
      else if (r.need === "verify") setError("Confirmez d'abord votre adresse e-mail : utilisez le lien reçu, ou « Renvoyer le lien » en haut de la page.");
      else setError(r.error ?? "Demande impossible.");
    });

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn(buttonVariants({ variant: "gold", size: "lg" }), "w-full")}>
        <CalendarCheck className="size-4" aria-hidden /> Demander une visite
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={state === "sent" ? "Demande envoyée" : "Demander une visite"}>
        {state === "sent" ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto size-10 text-forest-800" aria-hidden />
            <p className="mt-3 text-ink-600">Le propriétaire et l&apos;équipe VerdOlive sont prévenus. Vous suivez votre demande dans « Mes visites ».</p>
            <Link href="/compte/visites" className={cn(buttonVariants({ variant: "forest" }), "mt-5")}>
              Mes visites
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {!charter && (
              <div className="rounded-xl bg-white p-4 ring-1 ring-forest-900/10">
                <p className="font-semibold text-forest-900">Charte de l&apos;investissement responsable</p>
                <p className="mt-1 text-sm text-ink-600">Avant votre premier contact, vous vous engagez à :</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-900">
                  {CHARTER.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <Link href="/charte" target="_blank" className="mt-2 inline-block text-sm text-forest-800 underline underline-offset-2">
                  Lire la charte complète
                </Link>
                <label className="mt-3 flex items-start gap-3 text-sm font-medium">
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 size-5 accent-forest-800" />
                  J&apos;accepte la charte de l&apos;investissement responsable.
                </label>
              </div>
            )}
            {!emailVerified && (
              <p className="rounded-xl bg-gold-100 px-4 py-3 text-sm text-forest-900">
                Votre adresse e-mail doit être confirmée pour envoyer la demande.
              </p>
            )}
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">Votre message (facultatif)</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={1000}
                rows={3}
                className="w-full rounded-xl border border-forest-900/15 bg-white px-4 py-3 focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-500/30"
                placeholder="Présentez votre projet en quelques mots."
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">Disponibilités (facultatif)</span>
              <input
                value={dates}
                onChange={(e) => setDates(e.target.value)}
                maxLength={200}
                className="w-full rounded-xl border border-forest-900/15 bg-white px-4 py-3 focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-500/30"
                placeholder="Ex. samedis de décembre"
              />
            </label>
            {error && (
              <p className="rounded-xl bg-danger-600/10 px-4 py-3 text-sm text-danger-600" role="alert">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={send}
              disabled={pending || (!charter && !agree)}
              className={cn(buttonVariants({ variant: "forest", size: "lg" }), "w-full")}
            >
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {charter ? "Envoyer la demande" : "Accepter la charte et envoyer"}
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}

const CATEGORIES = [
  ["wrong_info", "Information erronée"],
  ["land_conflict", "Conflit foncier"],
  ["water_conflict", "Conflit sur l'eau"],
  ["abuse", "Comportement abusif"],
  ["other", "Autre"],
] as const;

/** RES-09 : « Signaler un problème », avec ou sans compte. */
export function ReportButton({ landId, loggedIn }: { landId: string | null; loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number][0]>("wrong_info");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [ticket, setTicket] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-sm text-ink-600 underline underline-offset-2 hover:text-danger-600">
        <Flag className="size-4" aria-hidden /> Signaler un problème
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={ticket ? "Signalement reçu" : "Signaler un problème"}>
        {ticket ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto size-10 text-forest-800" aria-hidden />
            <p className="mt-3 text-ink-900">
              Merci. Votre signalement porte le numéro <strong>{ticket}</strong>.
            </p>
            <p className="mt-2 text-sm text-ink-600">L&apos;équipe VerdOlive l&apos;examine et vous répond sous 72 heures ouvrées.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Type de problème</legend>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={category === v}
                    onClick={() => setCategory(v)}
                    className={cn(
                      "min-h-10 rounded-full px-3.5 text-sm ring-1",
                      category === v ? "bg-forest-900 text-cream-50 ring-forest-900" : "bg-white text-ink-600 ring-forest-900/15",
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">Description</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={2000}
                className="w-full rounded-xl border border-forest-900/15 bg-white px-4 py-3 focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-500/30"
              />
            </label>
            {!loggedIn && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">Votre adresse e-mail, pour la réponse</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-forest-900/15 bg-white px-4 py-3 focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-500/30"
                />
              </label>
            )}
            {error && (
              <p className="rounded-xl bg-danger-600/10 px-4 py-3 text-sm text-danger-600" role="alert">
                {error}
              </p>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await reportProblem({ landId, category, message, email });
                  if (r.ok) setTicket(r.ticket ?? "");
                  else setError(r.error ?? "Erreur.");
                })
              }
              className={cn(buttonVariants({ variant: "forest", size: "lg" }), "w-full")}
            >
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Envoyer le signalement
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
