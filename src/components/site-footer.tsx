import { Award, Leaf, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";

const PROMISES = [
  { icon: ShieldCheck, title: "Titre et eau d'abord", text: "Chaque terrain répond aux deux questions décisives." },
  { icon: Award, title: "Déclaré ≠ vérifié", text: "Le badge « vérifié » n'est posé qu'après contrôle." },
  { icon: Leaf, title: "Investissement responsable", text: "Principes CSA / FAO : Personnes, Profit, Planète." },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-forest-900/10 bg-cream-100 text-ink-600">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-md font-serif text-2xl italic text-forest-900 sm:text-3xl">Ensemble, pour une Tunisie plus verte et plus prospère.</p>
          <ul className="grid gap-6 sm:grid-cols-3 lg:max-w-2xl">
            {PROMISES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <Icon className="mt-0.5 size-6 shrink-0 text-gold-600" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-ink-900">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-10 flex flex-col gap-4 border-t border-forest-900/10 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <nav aria-label="Liens légaux" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/conditions" className="hover:text-forest-800">Conditions d&apos;utilisation</Link>
            <Link href="/confidentialite" className="hover:text-forest-800">Confidentialité</Link>
            <Link href="/charte" className="hover:text-forest-800">Charte de l&apos;investissement responsable</Link>
            <Link href="/credits" className="hover:text-forest-800">Crédits photos</Link>
          </nav>
          <p>© {new Date().getFullYear()} VerdOlive</p>
        </div>
      </div>
    </footer>
  );
}
