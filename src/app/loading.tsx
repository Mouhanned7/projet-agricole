/** Affiché immédiatement pendant le chargement d'une page. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" role="status" aria-label="Chargement">
      <div className="fixed inset-x-0 top-16 z-50 h-1 overflow-hidden bg-olive-100">
        <span className="block h-full w-1/3 animate-[progress_1s_ease-in-out_infinite] bg-gold-500" />
      </div>
      <div className="h-9 w-64 animate-pulse rounded-lg bg-cream-200" />
      <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-cream-200" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-72 animate-pulse rounded-card bg-cream-200/70" />
        ))}
      </div>
    </div>
  );
}
