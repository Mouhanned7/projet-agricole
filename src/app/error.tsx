"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <h1 className="font-serif text-3xl font-semibold text-forest-900">Une erreur est survenue</h1>
      <p className="mt-3 text-ink-600">Réessayez dans un instant. Si le problème continue, contactez l&apos;équipe VerdOlive.</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-ink-400">Référence : {error.digest}</p>}
      <button type="button" onClick={reset} className="mt-8 rounded-full bg-forest-900 px-6 py-3 text-sm font-medium text-cream-50">
        Réessayer
      </button>
    </div>
  );
}
