"use client";

import { useTransition } from "react";
import { cancelVisit, updateVisitStatus } from "@/lib/investor/actions";

export function CancelVisitButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => start(async () => void (await cancelVisit(id)))} className="text-sm text-danger-600 underline underline-offset-2 disabled:opacity-50">
      Annuler la demande
    </button>
  );
}

export function VisitStatusButtons({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const next = (s: "seen" | "scheduled" | "done" | "cancelled") => start(async () => void (await updateVisitStatus(id, s)));
  const btn = "min-h-9 rounded-full px-3.5 text-sm ring-1 ring-forest-900/15 bg-white hover:ring-forest-900/40 disabled:opacity-50";
  return (
    <div className="flex flex-wrap gap-2">
      {status === "new" && <button disabled={pending} className={btn} onClick={() => next("seen")}>Marquer comme lue</button>}
      {["new", "seen"].includes(status) && <button disabled={pending} className={btn} onClick={() => next("scheduled")}>Visite planifiée</button>}
      {status === "scheduled" && <button disabled={pending} className={btn} onClick={() => next("done")}>Visite effectuée</button>}
      {!["done", "cancelled"].includes(status) && <button disabled={pending} className={btn} onClick={() => next("cancelled")}>Refuser</button>}
    </div>
  );
}
