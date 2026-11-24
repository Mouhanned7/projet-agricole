import type { Metadata } from "next";

export const metadata: Metadata = { title: "Charte de l’investissement responsable" };

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Charte de l’investissement responsable</h1>
      <p className="mt-4 rounded-xl bg-gold-100 px-4 py-3 text-sm text-forest-900">
        Texte en cours de rédaction par VerdOlive, à valider par un juriste avant la mise en ligne.
      </p>
    </div>
  );
}
