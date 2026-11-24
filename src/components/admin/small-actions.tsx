"use client";

import { useState, useTransition } from "react";
import { handleReport, resolveAlert } from "@/lib/admin/actions";

export function ResolveAlertButton({ id }: { id: number }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => start(async () => void (await resolveAlert(id)))} className="text-sm font-medium text-forest-800 underline underline-offset-2 disabled:opacity-50">
      Marquer comme traitée
    </button>
  );
}

export function ReportForm({ id, status, response }: { id: string; status: string; response: string | null }) {
  const [text, setText] = useState(response ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const act = (s: "in_progress" | "resolved" | "rejected") =>
    start(async () => {
      const r = await handleReport(id, s, text);
      setMsg(r.ok ? "Enregistré." : (r.error ?? "Erreur."));
    });
  const btn = "min-h-9 rounded-full px-3.5 text-sm ring-1 ring-forest-900/15 bg-white hover:ring-forest-900/40 disabled:opacity-50";
  return (
    <div className="mt-3 space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="Réponse envoyée à l'auteur du signalement"
        className="w-full rounded-xl border border-forest-900/15 bg-white px-3 py-2 text-sm focus:border-olive-600 focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-2">
        {status === "open" && <button disabled={pending} className={btn} onClick={() => act("in_progress")}>Prendre en charge</button>}
        <button disabled={pending} className={btn} onClick={() => act("resolved")}>Résolu</button>
        <button disabled={pending} className={btn} onClick={() => act("rejected")}>Rejeté</button>
        {msg && <span className="text-sm text-ink-600">{msg}</span>}
      </div>
    </div>
  );
}
