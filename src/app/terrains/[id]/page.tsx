import { ArrowLeft, Droplets, FileText, Info, Lock, MapPin, Maximize2, Sprout, TreePine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PointMap } from "@/components/catalog/point-map";
import { LandPhoto } from "@/components/land-photo";
import { priceLine } from "@/components/land-card";
import { DiagnosticView } from "@/components/land/diagnostic-view";
import { FavoriteButton, ReportButton, VisitRequest } from "@/components/land/land-actions";
import { getDiagnostic } from "@/lib/geoai/service";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge, TitlePill, WaterPill } from "@/components/ui/proof-pills";
import { getSession } from "@/lib/auth/session";
import { priceBenchmark } from "@/lib/catalog/price";
import { getCatalogItem, getCatalogItems } from "@/lib/catalog/source";
import { sendMessage } from "@/lib/extras/actions";
import type { CatalogItem } from "@/lib/catalog/types";
import { WATER_SOURCES } from "@/lib/lands/draft";
import { OBJECTIVE_LABEL } from "@/lib/lands/labels";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { cn, formatHa, formatTnd } from "@/lib/utils";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const land = UUID.test(id) ? await getCatalogItem(id) : null;
  return { title: land?.name ?? "Terrain" };
}

const YNU = { yes: "Oui", no: "Non", unknown: "Je ne sais pas" } as const;
const AVAIL = { year_round: "Toute l'année", seasonal: "Saisonnière", uncertain: "Incertaine" } as const;
const STATE = { exploited: "Exploité", partial: "Partiellement exploité", abandoned: "Abandonné" } as const;
const ALT_DOC: Record<string, string> = {
  adoulaire: "Acte adoulaire",
  sale_contract: "Contrat de vente",
  ownership_certificate: "Certificat de propriété",
  other: "Autre document",
  none: "Aucun document",
};
const NATURE: Record<string, string> = { declared: "déclaré", measured: "mesuré", estimated: "estimé", verified: "vérifié" };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,10rem)_1fr] gap-3 py-2.5 text-sm sm:grid-cols-[14rem_1fr]">
      <dt className="text-ink-400">{label}</dt>
      <dd className="font-medium text-ink-900">{children}</dd>
    </div>
  );
}

function Section({ id, title, icon, children, className }: { id: string; title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={cn("rounded-card bg-white p-5 ring-1 ring-forest-900/10 sm:p-6", className)}>
      <h2 id={id} className="flex items-center gap-2 text-lg font-semibold text-forest-900">
        {icon}
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Score({ label, value, help }: { label: string; value: number | null; help: string }) {
  return (
    <div className="rounded-xl bg-cream-100 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-forest-900">{value == null ? "—" : `${value}/100`}</p>
      {value != null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream-200" aria-hidden>
          <span className="block h-full rounded-full bg-olive-600" style={{ width: `${value}%` }} />
        </div>
      )}
      <p className="mt-2 text-xs text-ink-600">{help}</p>
    </div>
  );
}

function sourceLabel(l: CatalogItem) {
  return l.waterSources.map((s) => WATER_SOURCES.find((x) => x.value === s)?.label ?? s).join(", ");
}

/** Fiche détaillée (§6.4). Rubriques B (juridique) et C (eau) en haut. Aperçu limité sans compte (D8). */
export default async function LandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const [land, session] = await Promise.all([getCatalogItem(id), getSession()]);
  if (!land) notFound();

  let favorite = false;
  let diag: Awaited<ReturnType<typeof getDiagnostic>> = null;
  if (supabaseConfigured) diag = await getDiagnostic(await createClient(), id);
  if (session && supabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase.from("favorites").select("land_id").eq("land_id", id).eq("user_id", session.userId).maybeSingle();
    favorite = Boolean(data);
  }
  const loggedIn = Boolean(session);
  const price = priceLine(land);
  const bench = land.objective === "sale" ? priceBenchmark(land, (await getCatalogItems()).items) : null;
  const details = land.offerDetails as Record<string, string | number | boolean | null>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <Link href="/catalogue" className="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-forest-900">
        <ArrowLeft className="size-4" aria-hidden /> Retour aux résultats
      </Link>

      {/* En-tête */}
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="grid gap-2">
          <div className="relative aspect-[16/10] overflow-hidden rounded-card bg-cream-200">
            <LandPhoto
              src={land.photoUrls[0]}
              landId={land.id}
              crops={`${land.crops ?? ""} ${land.trees.map((t) => t.species).join(" ")} ${land.name}`}
              alt={`Photo du terrain ${land.name}`}
              sizes="(min-width: 1024px) 60vw, 100vw"
              priority
            />
            <StatusBadge status={land.rankingStatus} className="absolute left-3 top-3" />
          </div>
          {land.photoUrls.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {land.photoUrls.slice(1, loggedIn ? 9 : 5).map((u, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={u} src={u} alt={`Photo ${i + 2}`} className="aspect-square rounded-xl object-cover" />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <p className="text-sm text-ink-400">
            {land.ref} · {OBJECTIVE_LABEL[land.objective]}
          </p>
          <h1 className="mt-1 font-serif text-4xl font-semibold leading-tight text-forest-900">{land.name}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-ink-600">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden />
              {[land.delegation, land.governorate].filter(Boolean).join(", ")}
            </span>
            {land.areaHa != null && (
              <span className="inline-flex items-center gap-1.5">
                <Maximize2 className="size-4" aria-hidden /> {formatHa(land.areaHa)}
              </span>
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <TitlePill proof={land.titleProof} answer={land.titleAnswer} />
            <WaterPill proof={land.waterProof} />
          </div>
          <p className="mt-3 text-sm text-ink-400">Classement : {land.rankingReason}</p>

          <div className="mt-5 rounded-card bg-cream-100 p-4">
            <p className="text-xs uppercase tracking-wide text-ink-400">{price.label}</p>
            <p className="text-3xl font-semibold text-forest-900">{price.value}</p>
            {land.objective === "sale" && land.negotiable && <p className="text-sm text-ink-600">Négociable : {land.negotiable === "unknown" ? "à discuter" : YNU[land.negotiable]}</p>}
          </div>

          {bench && (
            <p className="mt-2 text-sm text-ink-600">
              Repère ({bench.zone}, {bench.count} ventes) : médiane {formatTnd(bench.perHa)} / ha, de {formatTnd(bench.low)} à {formatTnd(bench.high)}.
              {land.priceTnd && land.areaHa && land.priceTnd / land.areaHa > bench.perHa * 1.5 ? " Ce prix est nettement au-dessus de la zone." : ""} Indicatif.
            </p>
          )}

          <div className="mt-5 grid gap-3">
            <VisitRequest
              landId={land.id}
              loggedIn={loggedIn}
              charterAccepted={Boolean(session?.profile?.charter_accepted_at)}
              emailVerified={Boolean(session?.profile?.email_verified_at)}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <FavoriteButton landId={land.id} initial={favorite} loggedIn={loggedIn} />
              <ReportButton landId={land.id} loggedIn={loggedIn} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5">
        {/* B. Situation juridique */}
        <Section id="juridique" title="Situation juridique et foncière" icon={<FileText className="size-5 text-gold-600" aria-hidden />}>
          <dl className="divide-y divide-forest-900/5">
            <Row label="Titre foncier">
              {land.titleAnswer ? YNU[land.titleAnswer] : "Non renseigné"}{" "}
              <span className="ml-1 align-middle">
                <TitlePill proof={land.titleProof} answer={land.titleAnswer} />
              </span>
            </Row>
            {land.titleAnswer === "yes" && (
              <Row label="Numéro du titre">
                <span className="inline-flex items-center gap-1.5 text-ink-600">
                  <Lock className="size-3.5" aria-hidden /> Communiqué après mise en relation
                </span>
              </Row>
            )}
            {land.titleAnswer === "no" && land.altDocument && <Row label="Document disponible">{ALT_DOC[land.altDocument] ?? land.altDocument}</Row>}
            {land.ownership && (
              <Row label="Nature de la propriété">
                {land.ownership === "individual" ? "Individuelle" : land.ownership === "joint" ? "Indivision" : "Autre"}
                {land.ownership === "joint" && <span className="ml-2 text-ink-600">· {land.jointOwnersAgree ? "accord des indivisaires déclaré" : "accord à vérifier"}</span>}
              </Row>
            )}
            <Row label="Vérification">
              {land.titleProof === "verified"
                ? `Vérifié par VerdOlive${land.titleVerifiedAt ? ` le ${new Date(land.titleVerifiedAt).toLocaleDateString("fr-FR")}` : ""}`
                : "Informations déclarées par le propriétaire, non vérifiées"}
            </Row>
            {land.titleNotes && <Row label="Réserves">{land.titleNotes}</Row>}
            <Row label="Documents fournis">{land.documentsCount ? `${land.documentsCount} pièce${land.documentsCount > 1 ? "s" : ""} (consultables par VerdOlive)` : "Aucun"}</Row>
          </dl>
        </Section>

        {/* C. Eau */}
        <Section id="eau" title="Ressources en eau" icon={<Droplets className="size-5 text-sky-700" aria-hidden />}>
          <dl className="divide-y divide-forest-900/5">
            <Row label="Eau disponible">
              {land.waterAnswer ? YNU[land.waterAnswer] : "Non renseigné"}{" "}
              <span className="ml-1 align-middle">
                <WaterPill proof={land.waterProof} />
              </span>
            </Row>
            {land.waterAnswer === "yes" && (
              <>
                <Row label="Source">{sourceLabel(land) || "Non précisée"}</Row>
                <Row label="Disponibilité">{land.waterAvailability ? AVAIL[land.waterAvailability] : "Non précisée"}</Row>
                <Row label="Débit">
                  {land.flowValue != null
                    ? `${land.flowValue} ${land.flowUnit === "m3_h" ? "m³/h" : "l/s"} (${NATURE[land.flowNature ?? "declared"]})`
                    : "Non renseigné"}
                </Row>
                {land.depthM != null && <Row label="Profondeur">{land.depthM} m</Row>}
                {land.salinityGL != null && <Row label="Salinité">{land.salinityGL} g/l (déclarée)</Row>}
                {land.waterEquipment && <Row label="Équipements">{land.waterEquipment}</Row>}
                {land.waterShared && (
                  <Row label="Eau partagée">
                    {YNU[land.waterShared]}
                    {land.waterShared === "yes" && land.waterSharedDetails && <span className="mt-1 block font-normal text-ink-600">{land.waterSharedDetails}</span>}
                  </Row>
                )}
              </>
            )}
            {land.waterAnswer === "no" && (
              <Row label="Source à proximité">
                {land.nearbySource ? YNU[land.nearbySource] : "Non renseigné"}
                {land.nearbyDistanceKm != null && ` · environ ${land.nearbyDistanceKm} km`}
              </Row>
            )}
          </dl>
        </Section>

        {loggedIn ? (
          <>
            {/* Indicateurs distincts (§5.3, scénario 15) */}
            <Section id="indicateurs" title="Indicateurs du dossier">
              <p className="text-sm text-ink-600">Chaque indicateur est calculé séparément : aucun score unique ne mélange qualité juridique et potentiel agricole.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Score label="Juridique" value={land.scoreLegal} help="Titre, nature de la propriété, pièces fournies et vérification." />
                <Score label="Hydrique" value={land.scoreWater} help="Présence d'eau, source, disponibilité, débit et analyses." />
                <Score label="Agricole" value={land.scoreAgri} help={land.scoreAgri == null ? "Disponible avec le diagnostic agricole (phase 2)." : "Sol, climat, topographie et cultures adaptées."} />
                <Score label="Complétude" value={land.scoreCompleteness} help="Part des informations et documents attendus qui sont fournis." />
              </div>
            </Section>

            {/* A. Informations générales */}
            <Section id="general" title="Le terrain" icon={<TreePine className="size-5 text-olive-600" aria-hidden />}>
              {land.description && <p className="mb-3 whitespace-pre-line text-ink-900">{land.description}</p>}
              <dl className="divide-y divide-forest-900/5">
                {land.areaHa != null && <Row label="Superficie">{formatHa(land.areaHa)}{land.exploitableAreaHa != null && ` (dont ${formatHa(land.exploitableAreaHa)} exploitables)`}</Row>}
                {land.state && <Row label="État">{STATE[land.state]}</Row>}
                {land.trees.length > 0 && (
                  <Row label="Plantations">{land.trees.map((t) => [t.species, t.count && `${t.count} arbres`, t.age].filter(Boolean).join(", ")).join(" · ")}</Row>
                )}
                {land.crops && <Row label="Cultures">{land.crops}</Row>}
                {land.buildings && <Row label="Constructions">{land.buildings}</Row>}
                {land.latApprox != null && <Row label="Zone">≈ {land.latApprox}, {land.lngApprox} (position approximative)</Row>}
                {land.extra.soilType && <Row label="Type de sol">{land.extra.soilType}</Row>}
                {land.extra.soilAnalyses && <Row label="Analyses de sol (déclarées)">{land.extra.soilAnalyses}</Row>}
                {!!land.extra.equipment?.length && <Row label="Équipements">{land.extra.equipment.join(", ")}</Row>}
                {land.extra.treesValueTnd != null && <Row label="Valeur des arbres (estimée par le porteur)">{formatTnd(land.extra.treesValueTnd)}</Row>}
                {land.extra.buildingsValueTnd != null && <Row label="Valeur des constructions (estimée)">{formatTnd(land.extra.buildingsValueTnd)}</Row>}
                {land.extra.worksTnd != null && <Row label="Travaux nécessaires (estimés)">{formatTnd(land.extra.worksTnd)}</Row>}
                {land.extra.currentOperation && <Row label="Exploitation actuelle">{land.extra.currentOperation}</Row>}
                {!!land.practices.length && <Row label="Pratiques durables déclarées">{land.practices.join(", ")}</Row>}
                {land.extra.localKnowledge && <Row label="Variétés et savoir-faire locaux">{land.extra.localKnowledge}</Row>}
                {land.extra.localJobs != null && <Row label="Emplois locaux prévus">{land.extra.localJobs}</Row>}
              </dl>
              {land.latApprox != null && land.lngApprox != null && (
                <div className="mt-4">
                  <PointMap lat={land.latApprox} lng={land.lngApprox} />
                </div>
              )}
            </Section>

            {Boolean(details.ownerExperience || details.ownerParticipates != null) && (
              <Section id="proprietaire" title="Le propriétaire">
                <dl className="divide-y divide-forest-900/5">
                  {details.ownerExperience && <Row label="Expérience et disponibilité">{String(details.ownerExperience)}</Row>}
                  {details.ownerParticipates != null && <Row label="Participe au projet">{details.ownerParticipates ? "Oui" : "Non"}</Row>}
                </dl>
              </Section>
            )}

            {/* Conditions de l'offre (§3.4, RES-06) */}
            <Section id="conditions" title="Conditions proposées" icon={<Sprout className="size-5 text-olive-600" aria-hidden />}>
              <dl className="divide-y divide-forest-900/5">
                {land.objective === "sale" && (
                  <>
                    {land.priceTnd != null && <Row label="Prix demandé">{formatTnd(land.priceTnd)}</Row>}
                    {land.partialSale != null && <Row label="Vente">{land.partialSale ? "Une partie du terrain" : "La totalité du terrain"}</Row>}
                    {land.included.length > 0 && <Row label="Inclus">{land.included.join(", ")}</Row>}
                  </>
                )}
                {land.objective === "rent" && (
                  <>
                    {land.rentTnd != null && <Row label="Loyer">{formatTnd(land.rentTnd)} ({land.rentPeriod ?? "annuel"})</Row>}
                    {land.minDurationYears != null && <Row label="Durée minimale">{land.minDurationYears} ans</Row>}
                    {details.allowPlanting != null && <Row label="Plantation autorisée">{details.allowPlanting ? "Oui" : "Non"}</Row>}
                    {details.renewable != null && <Row label="Renouvelable">{details.renewable ? "Oui" : "Non"}</Row>}
                  </>
                )}
                {details.notes && <Row label="Précisions">{String(details.notes)}</Row>}
              </dl>

              {land.objective === "partnership" && (
                <div className="mt-2">
                  <p className="text-sm text-ink-600">
                    {land.partnershipType === "mgharsa" ? "Partenariat Mgharsa : le propriétaire apporte la terre, l'investisseur finance ou plante, selon une répartition convenue." : "Partenariat à définir avec le propriétaire."}
                  </p>
                  <table className="mt-4 w-full text-left text-sm">
                    <caption className="sr-only">Partage de la valeur envisagé</caption>
                    <thead>
                      <tr className="border-b border-forest-900/10 text-ink-400">
                        <th className="py-2 font-normal" />
                        <th className="py-2 font-semibold text-ink-900">Propriétaire</th>
                        <th className="py-2 font-semibold text-ink-900">Investisseur</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-forest-900/5">
                      <tr>
                        <th className="py-2.5 pr-3 font-normal text-ink-400">Contribution</th>
                        <td className="py-2.5 pr-3">{land.ownerContribution.join(", ") || "À préciser"}</td>
                        <td className="py-2.5">{land.investorContribution.join(", ") || "À préciser"}</td>
                      </tr>
                      <tr>
                        <th className="py-2.5 pr-3 font-normal text-ink-400">Répartition envisagée</th>
                        <td className="py-2.5 pr-3">{land.ownerSharePct != null ? `${land.ownerSharePct} %` : "À discuter"}</td>
                        <td className="py-2.5">{land.ownerSharePct != null ? `${Math.round((100 - land.ownerSharePct) * 100) / 100} %` : "À discuter"}</td>
                      </tr>
                      {details.durationYears != null && (
                        <tr>
                          <th className="py-2.5 pr-3 font-normal text-ink-400">Durée</th>
                          <td colSpan={2} className="py-2.5">{String(details.durationYears)} ans</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-4 flex gap-3 rounded-xl bg-cream-100 p-4 text-sm text-ink-600">
                <Info className="mt-0.5 size-5 shrink-0 text-olive-600" aria-hidden />
                <p>
                  <strong className="text-ink-900">Frais VerdOlive : </strong>
                  {land.feeNote ?? "communiqués avant tout engagement, sans frais cachés."} La plateforme présente les conditions souhaitées sans
                  générer de contrat : les modalités finales sont à formaliser avec des professionnels.
                </p>
              </div>
            </Section>

            <Section id="message" title="Écrire au propriétaire">
              <form action={sendMessage} className="space-y-3">
                <input type="hidden" name="land" value={land.id} />
                <textarea name="body" required rows={3} maxLength={2000} placeholder="Votre question" className="w-full rounded-xl border border-forest-900/15 px-3 py-2" />
                {!session?.profile?.charter_accepted_at && (
                  <label className="flex gap-2 text-sm">
                    <input type="checkbox" name="charter" required className="size-5" />
                    <span>J&apos;accepte la <Link href="/charte" className="underline">charte de l&apos;investissement responsable</Link>.</span>
                  </label>
                )}
                <button className="rounded-full bg-forest-900 px-5 py-2.5 text-sm font-medium text-cream-50">Envoyer le message</button>
              </form>
            </Section>

            <Section id="diagnostic" title="Diagnostic agricole et étude économique" icon={<Sprout className="size-5 text-olive-600" aria-hidden />}>
              {diag ? (
                <DiagnosticView diag={diag} />
              ) : (
                <p className="text-sm text-ink-600">Le diagnostic GeoAI (sol, climat, cultures adaptées, eau, économie) est en cours de préparation par l&apos;équipe VerdOlive.</p>
              )}
              <a href={`/terrains/${land.id}/rapport`} className="mt-5 inline-flex items-center gap-2 rounded-full bg-forest-900 px-5 py-2.5 text-sm font-medium text-cream-50 hover:bg-forest-800">
                Télécharger le rapport PDF
              </a>
            </Section>
          </>
        ) : (
          <div className="relative overflow-hidden rounded-card bg-white p-8 text-center ring-1 ring-forest-900/10">
            <Lock className="mx-auto size-8 text-forest-800" aria-hidden />
            <p className="mt-3 text-lg font-semibold text-ink-900">Voir la fiche complète</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-ink-600">
              Indicateurs, plantations, conditions détaillées et demande de visite : créez un compte gratuit en moins d&apos;une minute.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/inscription?profil=investisseur" className={buttonVariants({ variant: "gold" })}>
                Créer un compte
              </Link>
              <Link href={`/connexion?next=/terrains/${land.id}`} className={buttonVariants({ variant: "outline" })}>
                Se connecter
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
