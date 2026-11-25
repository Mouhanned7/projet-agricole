import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DiagnosticAdmin, DocumentReview, FeeNoteForm, StatusPanel, TitleVerification, WaterVerification } from "@/components/admin/dossier-actions";
import { DiagnosticView } from "@/components/land/diagnostic-view";
import { StatusBadge, TitlePill, WaterPill } from "@/components/ui/proof-pills";
import { getDiagnostic } from "@/lib/geoai/service";
import { GOVERNORATES, delegationId } from "@/lib/data/tunisia";
import { computeRanking } from "@/lib/domain/ranking";
import type { RankingStatus, TitleProof, WaterProof } from "@/lib/domain/types";
import { toRankingInput, WATER_SOURCES } from "@/lib/lands/draft";
import { OBJECTIVE_LABEL, WORKFLOW_LABEL } from "@/lib/lands/labels";
import { getDraft } from "@/lib/lands/queries";
import { createClient } from "@/lib/supabase/server";
import { formatHa, formatTnd } from "@/lib/utils";
import { requireAdminPage } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Dossier · Administration" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DOC_KIND: Record<string, string> = {
  title: "Titre foncier",
  alt_ownership: "Document de propriété",
  joint_agreement: "Accord des indivisaires",
  water_permit: "Autorisation puits / forage",
  water_analysis: "Analyse de l'eau",
  soil_analysis: "Analyse du sol",
  other: "Autre",
};
const DOC_STATUS: Record<string, string> = { received: "Reçu", to_review: "À vérifier", accepted: "Accepté", refused: "Refusé" };

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card bg-white p-5 ring-1 ring-forest-900/10">
      <h2 className="font-semibold text-ink-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Line({ k, v }: { k: string; v: React.ReactNode }) {
  if (v == null || v === "" || v === false) return null;
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-3 py-1.5 text-sm">
      <dt className="text-ink-400">{k}</dt>
      <dd className="text-ink-900">{v}</dd>
    </div>
  );
}

/** Dossier complet pour l'administration (§9) : données privées incluses (numéro de titre, pièces). */
export default async function AdminLandPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage("/admin/terrains");
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const loaded = await getDraft(id);
  if (!loaded) notFound();
  const supabase = await createClient();
  const [{ data: land }, { data: title }, { data: offer }, { data: docs }, { data: photos }, { data: history }, { data: owner }] = await Promise.all([
    supabase.from("lands").select("*").eq("id", id).single(),
    supabase.from("land_titles").select("verified_at, verification_notes, history").eq("land_id", id).maybeSingle(),
    supabase.from("land_offers").select("verdolive_fee_note").eq("land_id", id).maybeSingle(),
    supabase.from("land_documents").select("*").eq("land_id", id).order("created_at"),
    supabase.from("land_photos").select("storage_path").eq("land_id", id).order("position"),
    supabase.from("land_status_history").select("*").eq("land_id", id).order("created_at", { ascending: false }),
    supabase.from("lands").select("owner_id").eq("id", id).single().then(async ({ data }) =>
      data ? supabase.from("profiles").select("full_name, phone, city, country, email_verified_at").eq("id", data.owner_id).maybeSingle() : { data: null },
    ),
  ]);
  const sign = async (bucket: string, paths: string[]) =>
    paths.length ? ((await supabase.storage.from(bucket).createSignedUrls(paths, 900)).data ?? []).map((d) => d.signedUrl ?? undefined) : [];
  const [docUrls, photoUrls] = await Promise.all([sign("land-documents", (docs ?? []).map((d) => d.storage_path)), sign("land-photos", (photos ?? []).map((p) => p.storage_path))]);

  const diag = await getDiagnostic(supabase, id);
  const d = loaded.draft;
  const live = computeRanking(toRankingInput(d, loaded.media));
  const gov = GOVERNORATES.find((g) => g.id === d.location.governorateId);
  const deleg = gov?.delegations.find((x) => delegationId(gov.id, x) === d.location.delegationId);
  const isPublic = ["published", "matching", "negotiation"].includes(loaded.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-ink-400">
            {loaded.ref} · {WORKFLOW_LABEL[loaded.status]} · {d.objective ? OBJECTIVE_LABEL[d.objective] : "objectif ?"}
          </p>
          <h1 className="font-serif text-4xl font-semibold text-forest-900">{d.name ?? "Sans nom"}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={land.ranking_status as RankingStatus} className="bg-cream-100" />
            <TitlePill proof={land.title_proof as TitleProof} answer={d.title.answer} />
            <WaterPill proof={land.water_proof as WaterProof} />
          </div>
          <p className="mt-2 text-sm text-ink-600">{land.ranking_reason}</p>
        </div>
        {isPublic && (
          <Link href={`/terrains/${id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-forest-800 underline underline-offset-2">
            Fiche publique <ExternalLink className="size-4" aria-hidden />
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card title="Titre foncier (privé)">
            <dl>
              <Line k="Réponse" v={{ yes: "Oui", no: "Non", unknown: "Je ne sais pas" }[d.title.answer ?? "unknown"]} />
              <Line k="Numéro" v={d.title.number && <span className="font-mono">{d.title.number}</span>} />
              <Line k="Conservation" v={d.title.registry} />
              <Line k="Propriétaires inscrits" v={d.title.ownerNames} />
              <Line k="Nature" v={d.title.ownership && { individual: "Individuelle", joint: "Indivision", other: "Autre" }[d.title.ownership]} />
              <Line k="Accord indivisaires" v={d.title.ownership === "joint" && (d.title.jointOwnersAgree ? "Déclaré" : "Non confirmé")} />
              <Line k="Autre document" v={d.title.altDocument} />
              <Line k="Immatriculation en cours" v={d.title.registrationInProgress} />
              <Line k="Vérifié le" v={title?.verified_at && new Date(title.verified_at).toLocaleString("fr-FR")} />
              <Line k="Historique des réponses" v={Array.isArray(title?.history) && title.history.length > 0 && `${title.history.length} changement(s)`} />
            </dl>
            <div className="mt-4 border-t border-forest-900/10 pt-4">
              <TitleVerification landId={id} verified={land.title_proof === "verified"} notes={title?.verification_notes ?? null} hasTitle={d.title.answer === "yes"} />
            </div>
          </Card>

          <Card title="Eau">
            <dl>
              <Line k="Réponse" v={d.water.answer === "yes" ? "Oui" : d.water.answer === "no" ? "Non" : "—"} />
              <Line k="Sources" v={d.water.sources.map((s) => WATER_SOURCES.find((x) => x.value === s)?.label).join(", ")} />
              <Line k="Disponibilité" v={d.water.availability} />
              <Line k="Débit" v={d.water.flowValue != null && `${d.water.flowValue} ${d.water.flowUnit === "m3_h" ? "m³/h" : "l/s"} (${d.water.flowMeasured ? "mesuré" : "estimé"})`} />
              <Line k="Profondeur" v={d.water.depthM != null && `${d.water.depthM} m`} />
              <Line k="Salinité" v={d.water.salinityGL != null && `${d.water.salinityGL} g/l`} />
              <Line k="Autorisation" v={d.water.permit} />
              <Line k="Eau partagée" v={d.water.shared === "yes" ? `Oui : ${d.water.sharedDetails ?? ""}` : d.water.shared} />
              <Line k="Source proche" v={d.water.answer === "no" && `${d.water.nearbySource ?? "?"}${d.water.nearbyDistanceKm != null ? `, ${d.water.nearbyDistanceKm} km` : ""}`} />
            </dl>
            <div className="mt-4 border-t border-forest-900/10 pt-4">
              <WaterVerification landId={id} proof={land.water_proof} hasWater={d.water.answer === "yes"} />
            </div>
          </Card>

          <Card title={`Pièces justificatives (${docs?.length ?? 0})`}>
            {!docs?.length ? (
              <p className="text-sm text-ink-600">Aucune pièce.</p>
            ) : (
              <ul className="divide-y divide-forest-900/10">
                {docs.map((doc, i) => (
                  <li key={doc.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                    <div className="flex-1">
                      <a href={docUrls[i]} target="_blank" rel="noreferrer" className="font-medium text-forest-800 underline underline-offset-2">
                        {DOC_KIND[doc.kind]}
                      </a>
                      <p className="text-xs text-ink-400">
                        {DOC_STATUS[doc.status]} · déposé le {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                        {doc.reviewed_at && ` · vérifié le ${new Date(doc.reviewed_at).toLocaleDateString("fr-FR")}`}
                      </p>
                    </div>
                    <DocumentReview id={doc.id} status={doc.status} />
                  </li>
                ))}
              </ul>
            )}
            {photoUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {photoUrls.map((u) => (
                  <a key={u} href={u} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" className="aspect-square rounded-lg object-cover" />
                  </a>
                ))}
              </div>
            )}
          </Card>

          <Card title="Diagnostic GeoAI (§11)">
            <p className="mb-3 text-sm text-ink-600">
              Généré à partir des coordonnées (climat Open-Meteo, sol SoilGrids) et des déclarations. Il n&apos;est visible des investisseurs qu&apos;après votre validation.
            </p>
            <DiagnosticAdmin landId={id} status={diag?.status ?? null} />
            {diag && (
              <div className="mt-5 border-t border-forest-900/10 pt-5">
                <DiagnosticView diag={diag} />
              </div>
            )}
          </Card>

          <Card title="Terrain et offre">
            <dl>
              <Line k="Localisation" v={[deleg, gov?.fr].filter(Boolean).join(", ")} />
              <Line k="Coordonnées" v={d.location.lat != null && `${d.location.lat}, ${d.location.lng}`} />
              <Line k="Superficie" v={d.location.areaHa != null && formatHa(d.location.areaHa)} />
              <Line k="Arbres" v={d.land.trees.map((t) => `${t.species} ${t.count ?? ""}`).join(", ")} />
              <Line k="Prix" v={d.offer.priceTnd != null && formatTnd(d.offer.priceTnd)} />
              <Line k="Loyer" v={d.offer.rentTnd != null && `${formatTnd(d.offer.rentTnd)} (${d.offer.rentPeriod})`} />
              <Line k="Partenariat" v={d.offer.partnershipType && `${d.offer.partnershipType}, ${d.offer.ownerSharePct ?? "?"} % propriétaire`} />
              <Line k="Description" v={d.land.description} />
            </dl>
            <div className="mt-4 border-t border-forest-900/10 pt-4">
              <p className="mb-2 text-sm font-medium text-ink-900">Frais VerdOlive affichés sur la fiche (RES-06)</p>
              <FeeNoteForm landId={id} value={offer?.verdolive_fee_note ?? null} />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Traitement du dossier">
            <StatusPanel landId={id} status={loaded.status} canPublish={land.ranking_status !== "incomplete"} />
          </Card>

          <Card title="Contrôle automatique">
            <p className="text-sm text-ink-600">Complétude : {live.scores.completeness} %</p>
            {live.blockingIssues.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-sm text-danger-600">
                {live.blockingIssues.map((b) => <li key={b}>{b}</li>)}
              </ul>
            )}
            {live.actions.length > 0 && (
              <>
                <p className="mt-3 text-sm font-medium text-ink-900">Manque encore :</p>
                <ul className="mt-1 list-disc pl-5 text-sm text-ink-600">
                  {live.actions.slice(0, 6).map((a) => <li key={a}>{a}</li>)}
                </ul>
              </>
            )}
          </Card>

          <Card title="Porteur de terrain">
            <dl>
              <Line k="Nom" v={owner?.full_name} />
              <Line k="Téléphone" v={owner?.phone} />
              <Line k="Ville / pays" v={[owner?.city, owner?.country].filter(Boolean).join(", ")} />
              <Line k="E-mail confirmé" v={owner ? (owner.email_verified_at ? "Oui" : "Non") : null} />
            </dl>
          </Card>

          <Card title="Historique">
            <ol className="space-y-2">
              {(history ?? []).map((h) => (
                <li key={h.id} className="text-sm">
                  <span className="text-ink-400">{new Date(h.created_at).toLocaleString("fr-FR")} · </span>
                  {h.from_status ? `${WORKFLOW_LABEL[h.from_status as keyof typeof WORKFLOW_LABEL]} → ` : ""}
                  <strong>{WORKFLOW_LABEL[h.to_status as keyof typeof WORKFLOW_LABEL]}</strong>
                  {h.note && <span className="block text-ink-600">« {h.note} »</span>}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
