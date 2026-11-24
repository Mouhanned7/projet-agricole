import type { Metadata } from "next";
import { PHOTOS } from "@/lib/images";

export const metadata: Metadata = { title: "Crédits photos" };

export default function CreditsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Crédits photos</h1>
      <p className="mt-3 text-ink-600">
        Les photos d&apos;illustration proviennent d&apos;Unsplash (licence Unsplash, usage libre). Les cartes de terrains sans photo
        réelle affichent une photo d&apos;illustration, signalée comme telle.
      </p>
      <ul className="mt-6 divide-y divide-forest-900/10 rounded-card bg-white ring-1 ring-forest-900/10">
        {Object.values(PHOTOS).map((p) => (
          <li key={p.id} className="flex flex-wrap justify-between gap-2 px-5 py-3 text-sm">
            <span className="text-ink-900">{p.alt}</span>
            <a href={p.page} target="_blank" rel="noreferrer" className="text-forest-800 underline underline-offset-2">
              {p.author} / Unsplash
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
