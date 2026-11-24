import {
  ArrowRight,
  Droplets,
  FileText,
  Handshake,
  LandPlot,
  Leaf,
  Search,
  ShieldCheck,
  Sprout,
  TrendingUp,
  Users,
} from "lucide-react";
import { LandCard } from "@/components/land-card";
import { LandVisual } from "@/components/land-visual";
import { ButtonLink } from "@/components/ui/button";
import { DEMO_LANDS } from "@/lib/data/demo-lands";
import { compareRecommended } from "@/lib/domain/ranking";
import { formatHa } from "@/lib/utils";

// Tant que Supabase n'est pas branché, la page lit les terrains de démonstration.
const lands = [...DEMO_LANDS].sort((a, b) =>
  compareRecommended(
    { ...a.ranking, agriScore: null, hasFlow: Boolean(a.water.flow), completeness: a.ranking.scores.completeness, publishedAt: a.publishedAt },
    { ...b.ranking, agriScore: null, hasFlow: Boolean(b.water.flow), completeness: b.ranking.scores.completeness, publishedAt: b.publishedAt },
  ),
);
const visible = lands.filter((l) => l.ranking.status !== "low"); // décision D4
const hiddenLow = lands.length - visible.length;
const totalHa = lands.reduce((s, l) => s + l.areaHa, 0);
const withBoth = lands.filter((l) => l.title.answer === "yes" && l.water.answer === "yes").length;

export default function HomePage() {
  return (
    <>
      {/* Héro */}
      <section className="relative isolate overflow-hidden bg-forest-950">
        <div className="absolute inset-0 -z-10 opacity-90">
          <LandVisual seed={42} className="scale-110" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest-950/95 via-forest-950/70 to-forest-950/20" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-forest-950 to-transparent" />

        <div className="mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 sm:pb-20 sm:pt-24">
          <p className="text-sm font-medium tracking-wide text-gold-400">Terrains agricoles en Tunisie</p>
          <h1 className="mt-4 max-w-2xl font-serif text-5xl font-semibold leading-[1.05] text-cream-50 sm:text-6xl lg:text-7xl">
            Investir dans l&apos;avenir vert de la Tunisie
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream-100/85">
            Des terrains présentés avec leur titre foncier et leur eau, classés de façon transparente. Achat, location ou
            partenariat Mgharsa.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="#catalogue" variant="gold" size="lg">
              Explorer les terrains <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/inscription?profil=porteur" variant="outlineLight" size="lg">
              Publier mon terrain
            </ButtonLink>
          </div>

          <dl className="mt-14 grid max-w-3xl grid-cols-3 gap-4 border-t border-cream-50/15 pt-8">
            {[
              { icon: LandPlot, value: formatHa(totalHa), label: "proposés" },
              { icon: Sprout, value: String(lands.length), label: "terrains publiés" },
              { icon: Droplets, value: `${withBoth}/${lands.length}`, label: "avec titre et eau" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                <Icon className="size-7 text-gold-500" aria-hidden />
                <div>
                  <dt className="sr-only">{label}</dt>
                  <dd className="text-xl font-semibold text-cream-50 sm:text-2xl">{value}</dd>
                  <dd className="text-xs text-cream-100/70 sm:text-sm">{label}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Choix du profil en un clic (§2) */}
      <section aria-labelledby="profil-titre" className="mx-auto -mt-px max-w-7xl px-4 py-14 sm:px-6">
        <h2 id="profil-titre" className="text-center font-serif text-3xl font-semibold text-forest-900 sm:text-4xl">
          Vous êtes…
        </h2>
        <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-2">
          {[
            {
              href: "/inscription?profil=investisseur",
              icon: Search,
              title: "Investisseur",
              text: "Trouvez des terrains triés par titre foncier et disponibilité de l'eau, avec des filtres fiables.",
              cta: "Je cherche un terrain",
            },
            {
              href: "/inscription?profil=porteur",
              icon: LandPlot,
              title: "Porteur de terrain",
              text: "Vendez, louez ou trouvez un partenaire. Votre dossier est guidé étape par étape, enregistré automatiquement.",
              cta: "Je propose mon terrain",
            },
          ].map(({ href, icon: Icon, title, text, cta }) => (
            <a
              key={title}
              href={href}
              className="group flex flex-col rounded-card bg-white p-6 ring-1 ring-forest-900/10 transition hover:-translate-y-0.5 hover:ring-gold-500"
            >
              <span className="grid size-12 place-items-center rounded-full bg-olive-100 text-forest-800">
                <Icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-4 text-xl font-semibold text-ink-900">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">{text}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-forest-800 group-hover:text-gold-600">
                {cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Aperçu du catalogue (consultable sans compte, D2) */}
      <section id="catalogue" className="scroll-mt-16 bg-cream-100 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-forest-900 sm:text-4xl">Terrains disponibles</h2>
              <p className="mt-2 text-ink-600">Triés par « Recommandés » : titre foncier et eau d&apos;abord, puis preuves et complétude.</p>
            </div>
            <div className="flex flex-wrap gap-2" aria-label="Filtres rapides (bientôt actifs)">
              {["Tous", "Avec titre foncier", "Avec eau", "Vente", "Location", "Partenariat"].map((f, i) => (
                <span
                  key={f}
                  className={
                    i === 0
                      ? "rounded-full bg-forest-900 px-4 py-2 text-sm font-medium text-cream-50"
                      : "rounded-full bg-white px-4 py-2 text-sm text-ink-600 ring-1 ring-forest-900/10"
                  }
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((land, i) => (
              <LandCard key={land.id} land={land} index={i} />
            ))}
          </div>
          {hiddenLow > 0 && (
            <p className="mt-6 text-center text-sm text-ink-600">
              {hiddenLow} terrain{hiddenLow > 1 ? "s" : ""} sans titre ni eau masqué{hiddenLow > 1 ? "s" : ""} par défaut.
            </p>
          )}
          <p className="mt-2 text-center text-xs text-ink-400">Données de démonstration, fictives.</p>
        </div>
      </section>

      {/* Fonctionnement du classement (§5) */}
      <section id="fonctionnement" className="scroll-mt-16 mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="max-w-2xl font-serif text-3xl font-semibold text-forest-900 sm:text-4xl">
          Un classement lisible, sans score opaque
        </h2>
        <p className="mt-3 max-w-2xl text-ink-600">
          Deux questions décident de la place d&apos;un terrain : a-t-il un titre foncier ? L&apos;eau est-elle disponible ?
          Chaque terrain affiche la raison de son classement.
        </p>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { n: "1", title: "Prioritaire", text: "Titre foncier et eau confirmés, dossier documenté.", cls: "bg-gold-500 text-forest-950" },
            { n: "2", title: "Vérification nécessaire", text: "Un seul des deux est présent, ou la situation reste à confirmer.", cls: "bg-olive-100 text-forest-800" },
            { n: "3", title: "Non prioritaire", text: "Ni titre ni eau. Masqué par défaut, visible avec un filtre.", cls: "bg-cream-200 text-ink-600" },
          ].map((s) => (
            <li key={s.n} className="rounded-card bg-white p-6 ring-1 ring-forest-900/10">
              <span className={`grid size-9 place-items-center rounded-full text-sm font-bold ${s.cls}`}>{s.n}</span>
              <h3 className="mt-4 font-semibold text-ink-900">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex items-start gap-3 rounded-card bg-forest-900 p-5 text-cream-100">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-gold-400" aria-hidden />
          <p className="text-sm leading-relaxed">
            <strong className="text-cream-50">Déclaré n&apos;est pas vérifié.</strong> Un numéro de titre saisi affiche « Titre
            déclaré ». Le badge « Titre vérifié » n&apos;apparaît qu&apos;après contrôle des pièces par l&apos;équipe VerdOlive.
          </p>
        </div>
      </section>

      {/* Porteurs de terrain (§3) */}
      <section id="porteurs" className="scroll-mt-16 bg-forest-900 py-16 text-cream-100">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-serif text-3xl font-semibold text-cream-50 sm:text-4xl">Votre terrain mérite d&apos;être bien présenté</h2>
            <p className="mt-3 text-cream-100/80">
              Un assistant en 7 étapes, enregistré automatiquement. Une jauge vous montre en direct ce qui améliore la position de
              votre terrain.
            </p>
            <ButtonLink href="/inscription?profil=porteur" variant="gold" className="mt-8">
              Ajouter mon terrain <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Handshake, t: "Votre objectif", d: "Vendre, louer ou trouver un partenaire (Mgharsa)." },
              { icon: FileText, t: "Titre foncier", d: "Oui ou non, avec le numéro si vous l'avez." },
              { icon: Droplets, t: "Eau", d: "Source et disponibilité dans l'année." },
              { icon: LandPlot, t: "Terrain et photos", d: "Localisation, superficie, arbres, documents." },
            ].map(({ icon: Icon, t, d }, i) => (
              <li key={t} className="rounded-card bg-forest-800/70 p-5 ring-1 ring-cream-50/10">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gold-400">0{i + 1}</span>
                  <Icon className="size-5 text-gold-400" aria-hidden />
                </div>
                <p className="mt-3 font-semibold text-cream-50">{t}</p>
                <p className="mt-1 text-sm text-cream-100/75">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Personnes, Profit, Planète (§18) */}
      <section id="impact" className="scroll-mt-16 mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-center font-serif text-3xl font-semibold text-forest-900 sm:text-4xl">
          Une plateforme pour un avenir durable et rentable
        </h2>
        <div className="mt-10 grid divide-y divide-forest-900/10 md:grid-cols-3 md:divide-x md:divide-y-0">
          {[
            { icon: Users, t: "Personnes", d: "Respect des droits fonciers et de l'eau, accord des indivisaires, signalement simple." },
            { icon: TrendingUp, t: "Profit", d: "Partage de la valeur transparent, frais VerdOlive affichés avant tout engagement." },
            { icon: Leaf, t: "Planète", d: "Eau et sol préservés, cultures adaptées, pratiques durables mises en avant." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="flex flex-col items-center px-6 py-8 text-center">
              <Icon className="size-9 text-olive-600" aria-hidden />
              <h3 className="mt-4 font-serif text-2xl font-semibold text-forest-900">{t}</h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-600">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-ink-400">
          Cadre : Principes du CSA / FAO pour un investissement responsable dans l&apos;agriculture (2014).
        </p>
      </section>
    </>
  );
}
