import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { CatalogItem } from "@/lib/catalog/types";
import { STATUS_LABEL } from "@/lib/domain/ranking";
import { LEVEL_LABEL } from "@/lib/geoai/crops";
import type { StoredDiagnostic } from "@/lib/geoai/service";
import { PRESSURE_LABEL } from "@/lib/geoai/water-economics";

export const REPORT_VERSION = "1.0";

const C = { forest: "#24402a", ink: "#1e241a", muted: "#4e5747", light: "#858c7d", cream: "#f6f1e5", gold: "#b08a3a" };
const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: C.ink, fontFamily: "Helvetica", lineHeight: 1.4 },
  brand: { fontSize: 18, color: C.forest, fontFamily: "Helvetica-Bold" },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", marginTop: 14 },
  sub: { color: C.muted, marginTop: 2 },
  h2: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.forest, marginTop: 16, marginBottom: 6, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: "#d9d2bf" },
  row: { flexDirection: "row", paddingVertical: 2 },
  k: { width: 170, color: C.muted },
  v: { flex: 1 },
  box: { backgroundColor: C.cream, padding: 8, borderRadius: 4, marginTop: 6 },
  small: { fontSize: 8, color: C.light },
  th: { fontFamily: "Helvetica-Bold", color: C.muted },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, fontSize: 8, color: C.light, flexDirection: "row", justifyContent: "space-between" },
});

const tnd = (n: number) => `${n.toLocaleString("fr-FR").replace(/ | /g, " ")} TND`;
const TITLE = { verified: "Titre vérifié par VerdOlive", document: "Titre déclaré, document fourni", declared: "Titre déclaré (non vérifié)", none: "Sans titre foncier" } as const;
const WATER = { analyzed: "Eau analysée", documented: "Eau documentée", declared: "Eau déclarée (non vérifiée)", none: "Sans eau sur le terrain" } as const;
const OBJ = { sale: "Vente", rent: "Location", partnership: "Partenariat" } as const;

function Row({ k, v }: { k: string; v: string | number | null | undefined }) {
  if (v == null || v === "") return null;
  return (
    <View style={s.row}>
      <Text style={s.k}>{k}</Text>
      <Text style={s.v}>{String(v)}</Text>
    </View>
  );
}

/** Rapport PDF d'un terrain (§12). */
export function LandReport({ land, diag, generatedAt }: { land: CatalogItem; diag: StoredDiagnostic | null; generatedAt: Date }) {
  const d = diag?.data;
  return (
    <Document title={`VerdOlive - ${land.name}`} author="VerdOlive" language="fr">
      <Page size="A4" style={s.page}>
        <Text style={s.brand}>VerdOlive</Text>
        <Text style={s.title}>{land.name}</Text>
        <Text style={s.sub}>
          Référence {land.ref} · {OBJ[land.objective]} · {[land.delegation, land.governorate].filter(Boolean).join(", ")}
        </Text>

        <Text style={s.h2}>1. Informations générales</Text>
        <Row k="Superficie" v={land.areaHa != null ? `${land.areaHa} ha${land.exploitableAreaHa != null ? ` (${land.exploitableAreaHa} ha exploitables)` : ""}` : null} />
        <Row k="Localisation approximative" v={land.latApprox != null ? `${land.latApprox}, ${land.lngApprox}` : null} />
        <Row k="État" v={land.state ? { exploited: "Exploité", partial: "Partiellement exploité", abandoned: "Abandonné" }[land.state] : null} />
        <Row k="Plantations" v={land.trees.map((t) => [t.species, t.count && `${t.count} arbres`, t.age].filter(Boolean).join(", ")).join(" ; ") || land.crops} />
        <Row k="Photos disponibles" v={`${land.photoUrls.length}`} />

        <Text style={s.h2}>2. Situation foncière et eau</Text>
        <Row k="Titre foncier" v={`${land.titleAnswer === "yes" ? "Oui" : land.titleAnswer === "no" ? "Non" : "Non confirmé"} · ${TITLE[land.titleProof]}`} />
        <Row k="Nature de la propriété" v={land.ownership ? `${{ individual: "Individuelle", joint: "Indivision", other: "Autre" }[land.ownership]}${land.ownership === "joint" ? (land.jointOwnersAgree ? " (accord des indivisaires déclaré)" : " (accord à vérifier)") : ""}` : null} />
        <Row k="Réserves" v={land.titleNotes} />
        <Row k="Eau" v={`${land.waterAnswer === "yes" ? "Oui" : "Non"} · ${WATER[land.waterProof]}`} />
        <Row k="Source et disponibilité" v={land.waterAnswer === "yes" ? `${land.waterSources.join(", ")} · ${land.waterAvailability ?? "?"}` : null} />
        <Row k="Débit" v={land.flowValue != null ? `${land.flowValue} ${land.flowUnit === "m3_h" ? "m³/h" : "l/s"} (${land.flowNature === "measured" ? "mesuré" : "déclaré"})` : "Non renseigné"} />
        <Row k="Salinité de l'eau" v={land.salinityGL != null ? `${land.salinityGL} g/l (déclarée)` : null} />
        <Row k="Eau partagée" v={land.waterShared === "yes" ? `Oui : ${land.waterSharedDetails ?? ""}` : land.waterShared === "no" ? "Non" : null} />

        <Text style={s.h2}>3. Classement</Text>
        <Row k="Statut de classement" v={STATUS_LABEL[land.rankingStatus]} />
        <Row k="Raisons" v={land.rankingReason} />
        <Row k="Scores (sur 100)" v={`Juridique ${land.scoreLegal} · Hydrique ${land.scoreWater} · Agricole ${land.scoreAgri ?? "—"} · Complétude ${land.scoreCompleteness}`} />

        <Text style={s.h2}>4. Conditions de l&apos;offre</Text>
        <Row k="Prix demandé" v={land.priceTnd != null ? tnd(land.priceTnd) : null} />
        <Row k="Loyer" v={land.rentTnd != null ? `${tnd(land.rentTnd)} (${land.rentPeriod ?? "annuel"})` : null} />
        <Row k="Durée minimale" v={land.minDurationYears != null ? `${land.minDurationYears} ans` : null} />
        <Row k="Partenariat" v={land.partnershipType ? `${land.partnershipType === "mgharsa" ? "Mgharsa" : "Autre formule"}${land.ownerSharePct != null ? ` · propriétaire ${land.ownerSharePct} %, investisseur ${100 - land.ownerSharePct} %` : ""}` : null} />
        <Row k="Contribution du propriétaire" v={land.ownerContribution.join(", ")} />
        <Row k="Contribution de l'investisseur" v={land.investorContribution.join(", ")} />
        <Row k="Frais VerdOlive" v={land.feeNote ?? "Communiqués avant tout engagement"} />
      </Page>

      <Page size="A4" style={s.page}>
        <Text style={s.h2}>5. Données géospatiales, climatiques et de sol</Text>
        {d ? (
          d.dataPoints.map((p) => <Row key={p.label} k={p.label} v={`${p.value} (${p.nature} · ${p.source})`} />)
        ) : (
          <Text>Diagnostic non disponible pour ce terrain.</Text>
        )}

        {d && (
          <>
            <Text style={s.h2}>6. Diagnostic agricole {diag!.status === "validated" ? "(validé par VerdOlive)" : "(automatique, non relu)"}</Text>
            <Text>{d.summary}</Text>
            <View style={{ marginTop: 6 }}>
              {d.crops.map((c) => (
                <View key={c.crop} style={s.row}>
                  <Text style={s.k}>{c.label}</Text>
                  <Text style={s.v}>
                    {c.score}/100 · {LEVEL_LABEL[c.level]}
                    {c.constraints.length ? ` · ${c.constraints.join(" ")}` : ""}
                  </Text>
                </View>
              ))}
            </View>
            {d.waterPressure && (
              <View style={s.box}>
                <Text>
                  Pression sur l&apos;eau : {d.waterPressure.level ? PRESSURE_LABEL[d.waterPressure.level] : "non évaluée"}. Besoin {d.waterPressure.needM3.toLocaleString("fr-FR")} m³/an
                  {d.waterPressure.availableM3 != null ? `, disponible ${d.waterPressure.availableM3.toLocaleString("fr-FR")} m³/an` : ""}. {d.waterPressure.recommendation}
                </Text>
              </View>
            )}
            {d.recommendations.length > 0 && <Text style={{ marginTop: 6 }}>Recommandations : {d.recommendations.join(" ")}</Text>}
            {d.missing.length > 0 && <Text style={{ marginTop: 4 }}>Analyses complémentaires : {d.missing.join(" ")}</Text>}

            <Text style={s.h2}>7. Étude économique prévisionnelle</Text>
            <View style={s.row}>
              <Text style={[s.th, { width: 120 }]}>Culture</Text>
              <Text style={[s.th, { flex: 1 }]}>Investissement</Text>
              <Text style={[s.th, { flex: 1 }]}>Recettes/an</Text>
              <Text style={[s.th, { flex: 1 }]}>Marge/an</Text>
              <Text style={[s.th, { width: 60 }]}>Retour</Text>
            </View>
            {d.economics.map((e) => (
              <View key={e.crop} style={s.row}>
                <Text style={{ width: 120 }}>
                  {d.crops.find((c) => c.crop === e.crop)?.label} ({e.mode === "irrigated" ? "irrigué" : "sec"})
                </Text>
                <Text style={{ flex: 1 }}>{tnd(e.initialInvestmentTnd)}</Text>
                <Text style={{ flex: 1 }}>{tnd(e.annualRevenueTnd)}</Text>
                <Text style={{ flex: 1 }}>{tnd(e.annualMarginTnd)}</Text>
                <Text style={{ width: 60 }}>{e.paybackYears != null ? `${e.paybackYears} ans` : "-"}</Text>
              </View>
            ))}
            {d.economics[0] && <Text style={[s.small, { marginTop: 4 }]}>Hypothèses : {d.economics[0].hypotheses.join(" ")}</Text>}
          </>
        )}

        <Text style={s.h2}>Limites des données</Text>
        <Text style={s.small}>
          Les informations « déclarées » proviennent du propriétaire et n&apos;ont pas été vérifiées, sauf mention contraire. Les données « estimées » proviennent de
          modèles (réanalyse climatique ERA5, SoilGrids 250 m) et ne remplacent pas une analyse de laboratoire. Le diagnostic et l&apos;étude économique sont des outils
          d&apos;aide à la décision : ni expertise juridique, ni garantie de rendement ou de rentabilité. Les modalités d&apos;un accord doivent être formalisées par des
          professionnels compétents.
        </Text>

        <View style={s.footer} fixed>
          <Text>VerdOlive · rapport {land.ref} · version {REPORT_VERSION}</Text>
          <Text render={({ pageNumber, totalPages }) => `Généré le ${generatedAt.toLocaleDateString("fr-FR")} · page ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
