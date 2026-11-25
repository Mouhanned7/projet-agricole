/**
 * Ajoute des terrains de DÉMONSTRATION (fictifs) dans la base Supabase de .env.local.
 *
 *   npm run seed:db                ajoute les données (relançable : remplace la démo)
 *   npm run seed:db -- --dry-run   affiche ce qui serait ajouté, sans rien écrire
 *   npm run seed:db -- --remove    retire toutes les données de démonstration
 *
 * Les terrains appartiennent à un compte de démonstration dédié : le supprimer
 * retire tout, sans toucher à vos vrais comptes ni à vos vrais terrains.
 */
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { delegationId } from "../src/lib/data/tunisia";
import { computeRanking } from "../src/lib/domain/ranking";
import { draftSchema, toRankingInput, toRows, type LandDraftInput } from "../src/lib/lands/draft";

const OWNER_EMAIL = "demo.porteur@verdolive.test";
const args = process.argv.slice(2);

type Water = NonNullable<LandDraftInput["water"]>;
const well = (extra: Partial<Water> = {}): Water => ({ answer: "yes", sources: ["well"], availability: "year_round", ...extra });
const bore = (flow: number, extra: Partial<Water> = {}): Water => ({ answer: "yes", sources: ["borehole"], availability: "year_round", flowValue: flow, flowUnit: "l_s", flowMeasured: true, ...extra });
const dry = (nearby: "yes" | "no" = "no"): Water => ({ answer: "no", nearbySource: nearby, rainfed: nearby === "no" });
const deed = (n: string) => ({ answer: "yes" as const, number: `DEMO-${n}`, ownership: "individual" as const });

interface Demo {
  name: string;
  objective: "sale" | "rent" | "partnership";
  gov: string;
  deleg: string;
  at: [number, number];
  ha: number;
  trees?: [string, number, string];
  crops?: string;
  title: NonNullable<LandDraftInput["title"]>;
  water: Water;
  price?: number;
  rent?: number;
  share?: number;
  verified?: boolean;
  waterProof?: "documented" | "analyzed";
  daysAgo: number;
}

const DEMOS: Demo[] = [
  { name: "Oliveraie – Cap Bon", objective: "sale", gov: "nabeul", deleg: "Korba", at: [36.58, 10.86], ha: 50, trees: ["Olivier", 5000, "40 ans"], title: deed("001"), water: bore(4, { salinityGL: 1.2 }), price: 850000, verified: true, waterProof: "analyzed", daysAgo: 22 },
  { name: "Oliveraie Chemlali – Sfax", objective: "sale", gov: "sfax", deleg: "Agareb", at: [34.74, 10.47], ha: 75, trees: ["Olivier", 6200, "25 ans"], title: deed("002"), water: bore(6), price: 1200000, daysAgo: 15 },
  { name: "Terrain Mgharsa – Mahdia", objective: "partnership", gov: "mahdia", deleg: "Ksour Essef", at: [35.42, 10.99], ha: 120, crops: "Ancien céréalier", title: { answer: "yes", number: "DEMO-003", ownership: "joint", jointOwnersAgree: true }, water: well({ availability: "seasonal", shared: "yes", sharedDetails: "Puits partagé avec la parcelle voisine, tour d'eau le mardi." }), share: 40, daysAgo: 7 },
  { name: "Verger d'amandiers – Sidi Bouzid", objective: "rent", gov: "sidi-bouzid", deleg: "Regueb", at: [34.86, 9.79], ha: 30, trees: ["Amandier", 1800, "12 ans"], title: deed("004"), water: dry("yes"), rent: 18000, daysAgo: 10 },
  { name: "Palmeraie Deglet Nour – Tozeur", objective: "partnership", gov: "tozeur", deleg: "Nefta", at: [33.87, 7.88], ha: 8, trees: ["Palmier dattier", 780, "18 ans"], title: { answer: "unknown" }, water: { answer: "yes", sources: ["network"], availability: "year_round" }, share: 50, daysAgo: 5 },
  { name: "Oliveraie – Zaghouan", objective: "sale", gov: "zaghouan", deleg: "El Fahs", at: [36.37, 9.9], ha: 60, trees: ["Olivier", 4100, "25 ans"], title: deed("006"), water: bore(3), price: 990000, waterProof: "documented", daysAgo: 4 },
  { name: "Terre céréalière – Béja", objective: "rent", gov: "beja", deleg: "Medjez el-Bab", at: [36.65, 9.61], ha: 90, crops: "Blé dur, orge", title: deed("007"), water: well({ availability: "seasonal" }), rent: 36000, daysAgo: 12 },
  { name: "Figueraie – Bizerte", objective: "sale", gov: "bizerte", deleg: "Mateur", at: [37.04, 9.67], ha: 12, trees: ["Figuier", 900, "9 ans"], title: deed("008"), water: well(), price: 320000, daysAgo: 18 },
  { name: "Vergers de grenadiers – Gabès", objective: "partnership", gov: "gabes", deleg: "Mareth", at: [33.63, 10.29], ha: 15, trees: ["Grenadier", 2100, "7 ans"], title: deed("009"), water: bore(5, { salinityGL: 2.8 }), share: 35, verified: true, daysAgo: 9 },
  { name: "Pistachiers – Kasserine", objective: "sale", gov: "kasserine", deleg: "Sbeitla", at: [35.23, 9.12], ha: 40, trees: ["Pistachier", 3000, "14 ans"], title: deed("010"), water: dry("no"), price: 480000, daysAgo: 14 },
  { name: "Maraîchage irrigué – Kairouan", objective: "rent", gov: "kairouan", deleg: "Chebika", at: [35.62, 9.93], ha: 18, crops: "Tomate, piment, pastèque", title: deed("011"), water: bore(8), rent: 22000, daysAgo: 3 },
  { name: "Oliveraie – Siliana", objective: "partnership", gov: "siliana", deleg: "Makthar", at: [35.86, 9.2], ha: 55, trees: ["Olivier", 2600, "15 ans"], title: deed("012"), water: dry("yes"), share: 45, daysAgo: 20 },
  { name: "Agrumeraie – Soliman", objective: "sale", gov: "nabeul", deleg: "Soliman", at: [36.69, 10.49], ha: 9, trees: ["Agrumes", 1500, "11 ans"], title: deed("013"), water: { answer: "yes", sources: ["network", "well"], availability: "year_round" }, price: 610000, daysAgo: 2 },
  { name: "Terrain nu avec forage – Gafsa", objective: "partnership", gov: "gafsa", deleg: "El Guettar", at: [34.34, 8.95], ha: 70, title: { answer: "no", altDocument: "ownership_certificate", registrationInProgress: "yes" }, water: bore(7), share: 30, daysAgo: 8 },
  { name: "Palmeraie – Douz", objective: "sale", gov: "kebili", deleg: "Douz Nord", at: [33.46, 9.03], ha: 5, trees: ["Palmier dattier", 520, "20 ans"], title: deed("015"), water: { answer: "yes", sources: ["borehole"], availability: "year_round", salinityGL: 3.4 }, price: 275000, daysAgo: 16 },
  { name: "Amanderaie – Le Kef", objective: "rent", gov: "kef", deleg: "Dahmani", at: [35.95, 8.83], ha: 25, trees: ["Amandier", 1200, "8 ans"], title: deed("016"), water: dry("no"), rent: 9500, daysAgo: 25 },
  { name: "Oliveraie bio – Sousse", objective: "sale", gov: "sousse", deleg: "Enfidha", at: [36.13, 10.38], ha: 33, trees: ["Olivier", 2900, "30 ans"], title: deed("017"), water: well({ flowValue: 2, flowUnit: "l_s", flowMeasured: false }), price: 740000, verified: true, waterProof: "documented", daysAgo: 1 },
  { name: "Parcelle sans titre ni eau – Médenine", objective: "rent", gov: "medenine", deleg: "Beni Khedache", at: [33.25, 10.2], ha: 22, title: { answer: "no", altDocument: "adoulaire" }, water: dry("no"), rent: 4000, daysAgo: 28 },
];

function build(d: Demo) {
  const draft = draftSchema.parse({
    objective: d.objective,
    name: d.name,
    title: d.title,
    water: d.water,
    location: { governorateId: d.gov, delegationId: delegationId(d.gov, d.deleg), lat: d.at[0], lng: d.at[1], areaHa: d.ha },
    land: {
      state: d.trees ? "exploited" : "partial",
      trees: d.trees ? [{ species: d.trees[0], count: d.trees[1], age: d.trees[2] }] : [],
      crops: d.crops ?? null,
      description: "Terrain de démonstration (données fictives).",
    },
    offer:
      d.objective === "sale"
        ? { priceTnd: d.price, negotiable: "yes", partialSale: false, included: d.trees ? ["Arbres"] : [] }
        : d.objective === "rent"
          ? { rentTnd: d.rent, rentPeriod: "annuel", minDurationYears: 5, renewable: true }
          : { partnershipType: "mgharsa", ownerContribution: ["Mise à disposition du terrain", "Suivi local"], investorContribution: ["Financement", "Plantation"], ownerSharePct: d.share, durationYears: 15 },
  });
  // Photo comptée comme présente : le site affiche une photo d'illustration signalée.
  const input = toRankingInput(draft, { photoCount: 1, documentsCount: 0, hasTitleUpload: false, hasWaterAnalysis: false });
  if (d.verified) input.title.proof = "verified";
  if (d.waterProof) input.water.proof = d.waterProof;
  return { draft, rows: toRows(draft), ranking: computeRanking(input) };
}

if (args.includes("--dry-run")) {
  for (const d of DEMOS) {
    const { ranking } = build(d);
    console.log(`${ranking.status.padEnd(12)} ${d.name.padEnd(40)} ${ranking.reason}${ranking.canSubmit ? "" : "  ⚠️ incomplet"}`);
  }
  console.log(`\n${DEMOS.length} terrains. Rien n'a été écrit.`);
  process.exit(0);
}

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function must<T extends { error: { message: string } | null }>(p: PromiseLike<T>, what: string): Promise<T> {
  const r = await p;
  if (r.error) throw new Error(`${what} : ${r.error.message}`);
  return r;
}

// Retire la démonstration existante (et seulement elle).
async function remove() {
  const { data } = await must(db.from("lands").select("owner_id").like("description", "Terrain de démonstration%"), "recherche");
  const { data: list, error } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(`liste des comptes : ${error.message}`);
  const demo = list.users.find((u) => u.email === OWNER_EMAIL);
  if (!demo) return console.log(`Aucun compte de démonstration${data?.length ? " (des terrains de démo appartiennent à un autre compte)" : ""}.`);
  await must(db.from("lands").delete().eq("owner_id", demo.id), "suppression des terrains");
  const del = await db.auth.admin.deleteUser(demo.id);
  if (del.error) throw new Error(`suppression du compte : ${del.error.message}`);
  console.log("Données de démonstration retirées.");
}

await remove();
if (args.includes("--remove")) process.exit(0);

const { data: created, error } = await db.auth.admin.createUser({
  email: OWNER_EMAIL,
  password: randomBytes(24).toString("base64url"), // compte non destiné à la connexion
  email_confirm: true,
  user_metadata: { full_name: "Porteur Démo", role: "owner" },
});
if (error || !created.user) throw new Error(`compte de démonstration : ${error?.message}`);
const owner = created.user.id;
await must(db.from("profiles").update({ email_verified_at: new Date().toISOString() }).eq("id", owner), "profil");

for (const d of DEMOS) {
  const { rows, ranking, draft } = build(d);
  const date = new Date(Date.now() - d.daysAgo * 86_400_000).toISOString();
  const { data: land } = await must(
    db
      .from("lands")
      .insert({
        ...rows.land,
        owner_id: owner,
        status: "published",
        wizard_step: 7,
        submitted_at: date,
        published_at: date,
        ranking_status: ranking.status,
        ranking_reason: ranking.reason,
        title_proof: ranking.titleProof,
        water_proof: ranking.waterProof,
        has_flow: draft.water.flowValue != null && draft.water.answer === "yes",
        score_legal: ranking.scores.legal,
        score_water: ranking.scores.water,
        score_completeness: ranking.scores.completeness,
      })
      .select("id")
      .single(),
    d.name,
  );
  const id = (land as { id: string }).id;
  await must(db.from("land_titles").insert({ land_id: id, ...rows.title, ...(d.verified ? { verified_at: date } : {}) }), `${d.name} (titre)`);
  await must(db.from("land_water").insert({ land_id: id, ...rows.water }), `${d.name} (eau)`);
  await must(db.from("land_offers").insert({ land_id: id, ...rows.offer }), `${d.name} (offre)`);
  console.log(`✅ ${d.name}`);
}
console.log(`\n${DEMOS.length} terrains de démonstration publiés. Pour les retirer : npm run seed:db -- --remove`);
