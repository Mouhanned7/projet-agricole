import { ArrowRight, Droplets, FileText, Handshake, LandPlot, Leaf, Search, ShieldCheck, Sprout, TrendingUp, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LandCard } from "@/components/land-card";
import { ButtonLink } from "@/components/ui/button";
import { TitlePill, WaterPill } from "@/components/ui/proof-pills";
import { applyFilters, DEFAULT_FILTERS } from "@/lib/catalog/filters";
import { getCatalogItems, getCatalogSettings } from "@/lib/catalog/source";
import { PHOTOS, photoUrl, type PhotoKey } from "@/lib/images";
import { formatHa } from "@/lib/utils";

function Photo({ k, sizes, className, priority }: { k: PhotoKey; sizes: string; className?: string; priority?: boolean }) {
  return <Image src={photoUrl(k)} alt={PHOTOS[k].alt} fill sizes={sizes} priority={priority} quality={85} className={className ?? "object-cover"} />;
}

export default async function HomePage() {
  const [{ items: lands, demo }, settings] = await Promise.all([getCatalogItems(), getCatalogSettings()]);
  const { items, hiddenLow } = applyFilters(lands, DEFAULT_FILTERS, settings);
  const visible = items.slice(0, 6);
  const featured = items[0];
  const totalHa = lands.reduce((s, l) => s + (l.areaHa ?? 0), 0);
  const withBoth = lands.filter((l) => l.titleAnswer === "yes" && l.waterAnswer === "yes").length;

  return (
    <>
      {/* Héro clair : texte à gauche, grande photo à droite */}
      <section className="relative overflow-hidden bg-gradient-to-b from-cream-50 via-cream-50 to-cream-100">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-24 lg:pt-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-olive-100 px-3 py-1 text-sm font-medium text-forest-800">
              <Leaf className="size-4" aria-hidden /> Terrains agricoles en Tunisie
            </p>
            <h1 className="mt-5 font-serif text-5xl font-semibold leading-[1.02] text-forest-900 sm:text-6xl lg:text-7xl">
              Investir dans l&apos;avenir vert de la Tunisie
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-600">
              Des terrains présentés avec leur titre foncier et leur eau, classés de façon transparente. Achat, location ou partenariat Mgharsa.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/catalogue" variant="forest" size="lg">
                Explorer les terrains <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href="/inscription?profil=porteur" variant="outline" size="lg" className="bg-white">
                Publier mon terrain
              </ButtonLink>
            </div>
            {lands.length > 0 && <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-forest-900/10 pt-6">
              {[
                { icon: LandPlot, value: formatHa(totalHa), label: "proposés" },
                { icon: Sprout, value: String(lands.length), label: "terrains publiés" },
                { icon: Droplets, value: `${withBoth}/${lands.length}`, label: "avec titre et eau" },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label}>
                  <Icon className="size-6 text-gold-600" aria-hidden />
                  <dt className="sr-only">{label}</dt>
                  <dd className="mt-2 text-2xl font-semibold text-forest-900">{value}</dd>
                  <dd className="text-sm text-ink-600">{label}</dd>
                </div>
              ))}
            </dl>}
          </div>

          <div className="relative pb-6">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-[0_30px_60px_-30px_rgba(20,35,19,0.5)] sm:aspect-[5/4] lg:aspect-[4/5]">
              <Photo k="hero" sizes="(min-width: 1024px) 45vw, 100vw" priority className="object-cover object-[60%_50%]" />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-950/30 via-transparent to-transparent" />
            </div>
            <div className="absolute -left-4 bottom-0 hidden size-36 overflow-hidden rounded-3xl border-4 border-cream-50 shadow-xl sm:block lg:-left-10 lg:size-44">
              <Photo k="olives" sizes="180px" />
            </div>
            {featured && (
              <Link
                href={`/terrains/${featured.id}`}
                className="absolute bottom-0 right-4 w-64 rounded-2xl bg-white/95 p-4 shadow-xl ring-1 ring-forest-900/10 backdrop-blur transition hover:-translate-y-0.5 sm:right-6"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-gold-600">Terrain recommandé</p>
                <p className="mt-1 font-semibold text-ink-900">{featured.name}</p>
                <p className="text-sm text-ink-600">{[featured.governorate, featured.areaHa != null && formatHa(featured.areaHa)].filter(Boolean).join(" · ")}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <TitlePill proof={featured.titleProof} answer={featured.titleAnswer} />
                  <WaterPill proof={featured.waterProof} />
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Choix du profil en un clic (§2) */}
      <section aria-labelledby="profil-titre" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 id="profil-titre" className="text-center font-serif text-4xl font-semibold text-forest-900">Vous êtes…</h2>
        <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-2">
          {(
            [
              { href: "/inscription?profil=investisseur", photo: "grove", icon: Search, title: "Investisseur", text: "Trouvez des terrains triés par titre foncier et disponibilité de l'eau, avec des filtres fiables.", cta: "Je cherche un terrain" },
              { href: "/inscription?profil=porteur", photo: "oldOlive", icon: LandPlot, title: "Porteur de terrain", text: "Vendez, louez ou trouvez un partenaire. Dossier guidé étape par étape, enregistré automatiquement.", cta: "Je propose mon terrain" },
            ] as const
          ).map(({ href, photo, icon: Icon, title, text, cta }) => (
            <Link key={title} href={href} className="group overflow-hidden rounded-3xl bg-white ring-1 ring-forest-900/10 transition hover:-translate-y-0.5 hover:shadow-xl">
              <div className="relative aspect-[16/7] overflow-hidden">
                <Photo k={photo} sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="relative p-6">
                <span className="-mt-12 grid size-12 place-items-center rounded-2xl bg-white text-forest-800 shadow-md ring-1 ring-forest-900/10">
                  <Icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-4 text-xl font-semibold text-ink-900">{title}</h3>
                <p className="mt-2 text-ink-600">{text}</p>
                <span className="mt-5 inline-flex items-center gap-2 font-semibold text-forest-800 group-hover:text-gold-600">
                  {cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Aperçu du catalogue (consultable sans compte, D2) */}
      <section id="catalogue" className="scroll-mt-16 border-y border-forest-900/5 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-serif text-4xl font-semibold text-forest-900">Terrains disponibles</h2>
              <p className="mt-2 text-ink-600">Triés par « Recommandés » : titre foncier et eau d&apos;abord, puis preuves et complétude.</p>
            </div>
            <nav className="flex flex-wrap gap-2" aria-label="Filtres rapides">
              {[
                ["Tous", "/catalogue"],
                ["Avec titre foncier", "/catalogue?titre=avec"],
                ["Avec eau", "/catalogue?eau=avec"],
                ["Vente", "/catalogue?offre=sale"],
                ["Location", "/catalogue?offre=rent"],
                ["Partenariat", "/catalogue?offre=partnership"],
              ].map(([label, href], i) => (
                <Link
                  key={label}
                  href={href}
                  className={i === 0 ? "rounded-full bg-forest-900 px-4 py-2 text-sm font-medium text-cream-50" : "rounded-full bg-cream-50 px-4 py-2 text-sm text-ink-600 ring-1 ring-forest-900/10 hover:ring-forest-900/30"}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          {visible.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((land, i) => (
                <LandCard key={land.id} land={land} index={i} />
              ))}
            </div>
          ) : (
            <div className="mt-8 grid items-center gap-6 overflow-hidden rounded-3xl bg-cream-50 ring-1 ring-forest-900/10 md:grid-cols-2">
              <div className="relative aspect-[16/10] md:h-full">
                <Photo k="loneTree" sizes="(min-width: 768px) 50vw, 100vw" />
              </div>
              <div className="p-8">
                <p className="font-serif text-3xl font-semibold text-forest-900">Les premiers terrains arrivent</p>
                <p className="mt-2 text-ink-600">Les dossiers sont en cours de vérification par l&apos;équipe VerdOlive. Créez votre compte pour être parmi les premiers informés.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ButtonLink href="/inscription?profil=investisseur" variant="forest">Créer un compte</ButtonLink>
                  <ButtonLink href="/inscription?profil=porteur" variant="outline" className="bg-white">Proposer mon terrain</ButtonLink>
                </div>
              </div>
            </div>
          )}
          <div className="mt-10 flex flex-col items-center gap-2">
            {visible.length > 0 && <ButtonLink href="/catalogue" variant="outline">
              Voir tout le catalogue <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>}
            {hiddenLow > 0 && (
              <p className="text-sm text-ink-600">
                {hiddenLow} terrain{hiddenLow > 1 ? "s" : ""} sans titre ni eau masqué{hiddenLow > 1 ? "s" : ""} par défaut.
              </p>
            )}
            {demo && <p className="text-xs text-ink-400">Données de démonstration, fictives.</p>}
          </div>
        </div>
      </section>

      {/* Classement (§5) */}
      <section id="fonctionnement" className="scroll-mt-16 mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            <Photo k="oliveRow" sizes="(min-width: 1024px) 40vw, 100vw" />
          </div>
          <div>
            <h2 className="font-serif text-4xl font-semibold text-forest-900">Un classement lisible, sans score opaque</h2>
            <p className="mt-3 text-ink-600">
              Deux questions décident de la place d&apos;un terrain : a-t-il un titre foncier ? L&apos;eau est-elle disponible ? Chaque terrain affiche la raison de son classement.
            </p>
            <ol className="mt-6 space-y-3">
              {[
                { n: "1", title: "Prioritaire", text: "Titre foncier et eau confirmés, dossier documenté.", cls: "bg-gold-500 text-forest-950" },
                { n: "2", title: "Vérification nécessaire", text: "Un seul des deux est présent, ou la situation reste à confirmer.", cls: "bg-olive-100 text-forest-800" },
                { n: "3", title: "Non prioritaire", text: "Ni titre ni eau. Masqué par défaut, visible avec un filtre.", cls: "bg-cream-200 text-ink-600" },
              ].map((s) => (
                <li key={s.n} className="flex gap-4 rounded-2xl bg-white p-4 ring-1 ring-forest-900/10">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${s.cls}`}>{s.n}</span>
                  <div>
                    <h3 className="font-semibold text-ink-900">{s.title}</h3>
                    <p className="text-sm text-ink-600">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-5 flex items-start gap-3 rounded-2xl bg-olive-100 p-4 text-sm text-forest-900">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-forest-800" aria-hidden />
              <span>
                <strong>Déclaré n&apos;est pas vérifié.</strong> Un numéro de titre saisi affiche « Titre déclaré » ; le badge « Titre vérifié » n&apos;apparaît qu&apos;après contrôle des pièces par l&apos;équipe VerdOlive.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Porteurs de terrain (§3) */}
      <section id="porteurs" className="scroll-mt-16 bg-olive-100/60 py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-serif text-4xl font-semibold text-forest-900">Votre terrain mérite d&apos;être bien présenté</h2>
            <p className="mt-3 text-ink-600">Un assistant en 7 étapes, enregistré automatiquement. Une jauge vous montre en direct ce qui améliore la position de votre terrain.</p>
            <ol className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { icon: Handshake, t: "Votre objectif", d: "Vendre, louer ou trouver un partenaire (Mgharsa)." },
                { icon: FileText, t: "Titre foncier", d: "Oui ou non, avec le numéro si vous l'avez." },
                { icon: Droplets, t: "Eau", d: "Source et disponibilité dans l'année." },
                { icon: LandPlot, t: "Terrain et photos", d: "Localisation, superficie, arbres, documents." },
              ].map(({ icon: Icon, t, d }, i) => (
                <li key={t} className="rounded-2xl bg-white p-4 ring-1 ring-forest-900/10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gold-600">0{i + 1}</span>
                    <Icon className="size-5 text-forest-800" aria-hidden />
                  </div>
                  <p className="mt-2 font-semibold text-ink-900">{t}</p>
                  <p className="mt-0.5 text-sm text-ink-600">{d}</p>
                </li>
              ))}
            </ol>
            <ButtonLink href="/inscription?profil=porteur" variant="forest" className="mt-8">
              Ajouter mon terrain <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl lg:aspect-square">
            <Photo k="dateGrove" sizes="(min-width: 1024px) 50vw, 100vw" />
          </div>
        </div>
      </section>

      {/* Personnes, Profit, Planète (§18) */}
      <section id="impact" className="scroll-mt-16 mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-center font-serif text-4xl font-semibold text-forest-900">Une plateforme pour un avenir durable et rentable</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {(
            [
              { icon: Users, t: "Personnes", photo: "oldOlive", d: "Respect des droits fonciers et de l'eau, accord des indivisaires, signalement simple." },
              { icon: TrendingUp, t: "Profit", photo: "grove", d: "Partage de la valeur transparent, frais VerdOlive affichés avant tout engagement." },
              { icon: Leaf, t: "Planète", photo: "hills", d: "Eau et sol préservés, cultures adaptées, pratiques durables mises en avant." },
            ] as const
          ).map(({ icon: Icon, t, photo, d }) => (
            <div key={t} className="overflow-hidden rounded-3xl bg-white ring-1 ring-forest-900/10">
              <div className="relative aspect-[16/9]">
                <Photo k={photo} sizes="(min-width: 768px) 33vw, 100vw" />
              </div>
              <div className="p-6">
                <Icon className="size-7 text-olive-600" aria-hidden />
                <h3 className="mt-3 font-serif text-2xl font-semibold text-forest-900">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{d}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-ink-400">Cadre : Principes du CSA / FAO pour un investissement responsable dans l&apos;agriculture (2014).</p>
      </section>
    </>
  );
}
