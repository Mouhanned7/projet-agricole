/**
 * Recette de bout en bout (cahier des charges §17) sur la vraie base Supabase
 * et le site en ligne. Crée 3 comptes de test (@verdolive.test) et 3 terrains
 * « [TEST] », joue les scénarios, puis SUPPRIME tout (même en cas d'échec).
 * Aucun mot de passe n'est affiché.
 *
 * Usage : npx tsx scripts/e2e-live.mts [URL du site]
 */
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { applyFilters, DEFAULT_FILTERS, parseFilters } from "../src/lib/catalog/filters";
import { rowToItem } from "../src/lib/catalog/map";
import { computeRanking } from "../src/lib/domain/ranking";
import { diagnose } from "../src/lib/geoai/diagnose";
import { draftSchema, fromRows, toRankingInput, toRows, type DraftMedia, type LandDraftInput } from "../src/lib/lands/draft";

const SITE = (process.argv[2] ?? "https://verdolive-kappa.vercel.app").replace(/\/$/, "");
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]),
);
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = createClient(URL_, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(URL_, ANON, { auth: { persistSession: false } });

const RUN = randomBytes(3).toString("hex");
const results: { id: string; name: string; ok: boolean; detail: string }[] = [];
async function check(id: string, name: string, fn: () => Promise<string | void>) {
  try {
    const detail = (await fn()) ?? "";
    results.push({ id, name, ok: true, detail });
    console.log(`✅ ${id.padEnd(4)} ${name}${detail ? ` — ${detail}` : ""}`);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    results.push({ id, name, ok: false, detail });
    console.log(`❌ ${id.padEnd(4)} ${name} — ${detail}`);
  }
}
function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const users: Record<"owner" | "owner2" | "investor" | "admin", { id: string; email: string; client: SupabaseClient; cookie: string }> = {} as never;
const extraUserIds: string[] = [];
const photos: string[] = [];
let originalSettings: { key: string; value: unknown }[] = [];
const landIds: string[] = [];
const uploaded: string[] = [];

async function makeUser(key: keyof typeof users, role: "owner" | "investor", fullName: string) {
  const email = `e2e-${RUN}-${key}@verdolive.test`;
  const password = randomBytes(18).toString("base64url");
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName, role } });
  if (error || !data.user) throw new Error(`création ${key} : ${error?.message}`);
  const client = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { error: e2 } = await client.auth.signInWithPassword({ email, password });
  if (e2) throw new Error(`connexion ${key} : ${e2.message}`);
  // Session « navigateur » (cookies) pour ouvrir les pages connectées du site en ligne.
  const jar = new Map<string, string>();
  const web = createServerClient(URL_, ANON, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (l) => l.forEach((c) => (c.value ? jar.set(c.name, c.value) : jar.delete(c.name))) },
  });
  const { error: e3 } = await web.auth.signInWithPassword({ email, password });
  if (e3) throw new Error(`session web ${key} : ${e3.message}`);
  await new Promise((r) => setTimeout(r, 300));
  users[key] = { id: data.user.id, email, client, cookie: [...jar].map(([n, v]) => `${n}=${v}`).join("; ") };
}

/** Même enchaînement que saveDraft() + recomputeRanking() de l'application. */
async function saveLand(owner: SupabaseClient, ownerId: string, input: LandDraftInput, step: number, existing?: string) {
  const draft = draftSchema.parse(input);
  const rows = toRows(draft);
  let id = existing;
  if (!id) {
    const { data, error } = await owner.from("lands").insert({ ...rows.land, owner_id: ownerId, wizard_step: step }).select("id").single();
    if (error) throw new Error(`insert land : ${error.message}`);
    id = data.id as string;
    landIds.push(id);
  } else {
    const { error } = await owner.from("lands").update({ ...rows.land, wizard_step: step }).eq("id", id);
    if (error) throw new Error(`update land : ${error.message}`);
  }
  for (const [table, row] of [["land_titles", rows.title], ["land_water", rows.water], ["land_offers", rows.offer]] as const) {
    const { error } = await owner.from(table).upsert({ land_id: id, ...row });
    if (error) throw new Error(`${table} : ${error.message}`);
  }
  return { id: id!, draft };
}

async function recompute(id: string, draft: ReturnType<typeof draftSchema.parse>, media: DraftMedia) {
  const { data: cur } = await service.from("lands").select("title_proof, water_proof").eq("id", id).single();
  const input = toRankingInput(draft, media);
  if (cur?.title_proof === "verified") input.title.proof = "verified";
  if (cur?.water_proof === "documented" || cur?.water_proof === "analyzed") input.water.proof = cur.water_proof;
  const r = computeRanking(input);
  const { error } = await service
    .from("lands")
    .update({
      ranking_status: r.status, ranking_reason: r.reason, title_proof: r.titleProof, water_proof: r.waterProof,
      has_flow: draft.water.answer === "yes" && draft.water.flowValue != null,
      score_legal: r.scores.legal, score_water: r.scores.water, score_completeness: r.scores.completeness,
    })
    .eq("id", id);
  if (error) throw new Error(`classement : ${error.message}`);
  return r;
}

const page = async (path: string, cookie?: string) => {
  const res = await fetch(`${SITE}${path}`, { redirect: "manual", headers: cookie ? { cookie } : {} });
  const html = (await res.text()).replace(/<!-- -->/g, "").replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
  return { status: res.status, location: res.headers.get("location") ?? "", type: res.headers.get("content-type") ?? "", html };
};

/** Une page connectée doit répondre 200, sans écran d'erreur, avec les textes attendus. */
async function expectPage(path: string, who: keyof typeof users, texts: string[]) {
  const r = await page(path, users[who].cookie);
  assert(r.status === 200, `${path} (${who}) : HTTP ${r.status} ${r.location}`);
  assert(!r.html.includes(">Une erreur est survenue</h1>"), `${path} (${who}) : écran d'erreur`);
  const missing = texts.filter((t) => !r.html.includes(t));
  assert(missing.length === 0, `${path} (${who}) : absent → ${missing.join(" | ")}`);
  return r;
}

// Terrains de test
const A: LandDraftInput = {
  objective: "sale", name: `[TEST ${RUN}] Oliveraie titre + eau`,
  title: { answer: "yes", number: `E2E-${RUN}/12`, registry: "Nabeul", ownership: "individual" },
  water: { answer: "yes", sources: ["well"], availability: "year_round", flowValue: 4, flowUnit: "l_s", flowMeasured: true, salinityGL: 1.2 },
  location: { governorateId: "nabeul", delegationId: "nabeul-korba", lat: 36.58, lng: 10.86, areaHa: 20, exploitableAreaHa: 18 },
  land: { state: "exploited", trees: [{ species: "Olivier", count: 2000, age: "25 ans" }] },
  offer: { priceTnd: 900000, negotiable: "yes" },
};
const B: LandDraftInput = {
  objective: "partnership", name: `[TEST ${RUN}] Mgharsa titre sans eau`,
  title: { answer: "yes", number: `E2E-${RUN}/99`, ownership: "joint", jointOwnersAgree: true },
  water: { answer: "no", nearbySource: "yes", nearbyType: "forage voisin", nearbyDistanceKm: 2 },
  location: { governorateId: "kairouan", delegationId: "kairouan-haffouz", lat: 35.63, lng: 9.67, areaHa: 30 },
  offer: { partnershipType: "mgharsa", ownerContribution: ["Mise à disposition du terrain", "Travail"], investorContribution: ["Financement", "Plantation"], ownerSharePct: 40, durationYears: 20 },
};
const C: LandDraftInput = {
  objective: "rent", name: `[TEST ${RUN}] Terre sans titre ni eau`,
  title: { answer: "no", altDocument: "adoulaire" },
  water: { answer: "no", nearbySource: "no", rainfed: true },
  location: { governorateId: "sfax", delegationId: "sfax-agareb", lat: 34.74, lng: 10.47, areaHa: 15 },
  offer: { rentTnd: 9000, rentPeriod: "annuel", minDurationYears: 5 },
};
const media1: DraftMedia = { photoCount: 1, documentsCount: 1, hasTitleUpload: true, hasWaterAnalysis: false };

async function main() {
  console.log(`Recette VerdOlive · run ${RUN} · site ${SITE}\n`);

  await check("0", "Migrations installées (notifications, diagnostics, vue catalogue complète)", async () => {
    const n = await service.from("notifications").select("id", { head: true, count: "exact" });
    assert(!n.error, `table notifications absente → lancer le script SQL n°4 (${n.error?.message})`);
    const d = await service.from("land_diagnostics").select("land_id", { head: true, count: "exact" });
    assert(!d.error, `table land_diagnostics absente → lancer le script SQL n°6 (${d.error?.message})`);
    const v = await anon.from("catalog_lands").select("water_shared").limit(1);
    assert(!v.error, `vue catalogue ancienne → script n°4 (${v.error?.message})`);
  });

  await check("1-2", "Création des comptes : profil et rôle choisis à l'inscription, rôle admin refusé", async () => {
    await makeUser("owner", "owner", "Porteur Test");
    await makeUser("owner2", "owner", "Porteur Deux");
    await makeUser("investor", "investor", "Investisseur Test");
    await makeUser("admin", "investor", "Admin Test");
    const { data } = await users.owner.client.from("profiles").select("full_name, roles").eq("id", users.owner.id).single();
    assert(data?.roles?.[0] === "owner" && data.full_name === "Porteur Test", "profil porteur incorrect");
    const { error } = await users.investor.client.from("profiles").update({ roles: ["investor", "admin"] }).eq("id", users.investor.id);
    assert(error, "un utilisateur a pu se donner le rôle admin");
    await service.from("profiles").update({ roles: ["admin"] }).eq("id", users.admin.id);
    return "4 comptes créés, admin promu par la clé serveur";
  });

  let a = { id: "", draft: draftSchema.parse(A) };
  await check("7", "Brouillon enregistré à l'étape 4 puis repris à l'identique", async () => {
    a = await saveLand(users.owner.client, users.owner.id, A, 4);
    const [{ data: l }, { data: t }, { data: w }, { data: o }] = await Promise.all([
      users.owner.client.from("lands").select("*").eq("id", a.id).single(),
      users.owner.client.from("land_titles").select("*").eq("land_id", a.id).single(),
      users.owner.client.from("land_water").select("*").eq("land_id", a.id).single(),
      users.owner.client.from("land_offers").select("*").eq("land_id", a.id).single(),
    ]);
    assert(l.wizard_step === 4, "étape non conservée");
    assert(JSON.stringify(fromRows(l, t, w, o)) === JSON.stringify(a.draft), "le brouillon relu diffère");
  });

  await check("3-6", "Titre et eau obligatoires, champs conditionnels contrôlés avant soumission", async () => {
    const noNumber = computeRanking(toRankingInput(draftSchema.parse({ ...A, title: { answer: "yes", ownership: "individual" } })));
    assert(!noNumber.canSubmit && noNumber.blockingIssues.join().includes("numéro"), "titre Oui sans numéro accepté");
    const noAlt = computeRanking(toRankingInput(draftSchema.parse({ ...C, title: { answer: "no" } })));
    assert(!noAlt.canSubmit, "titre Non sans autre document accepté");
    const noSource = computeRanking(toRankingInput(draftSchema.parse({ ...A, water: { answer: "yes" } })));
    assert(!noSource.canSubmit, "eau Oui sans source accepté");
    const noNearby = computeRanking(toRankingInput(draftSchema.parse({ ...C, water: { answer: "no" } })));
    assert(!noNearby.canSubmit, "eau Non sans « source à proximité » accepté");
  });

  await check("20", "Indivision : accord des indivisaires obligatoire", async () => {
    const r = computeRanking(toRankingInput(draftSchema.parse({ ...B, title: { ...B.title, jointOwnersAgree: false } })));
    assert(!r.canSubmit, "indivision sans accord acceptée");
  });

  await check("D7", "Soumission refusée tant que l'e-mail n'est pas confirmé", async () => {
    await recompute(a.id, a.draft, media1);
    const { error } = await users.owner.client.from("lands").update({ status: "submitted" }).eq("id", a.id);
    assert(error?.message.includes("Confirmez"), `attendu un refus, reçu : ${error?.message ?? "accepté"}`);
    for (const u of ["owner", "owner2", "investor", "admin"] as const)
      await service.from("profiles").update({ email_verified_at: new Date().toISOString() }).eq("id", users[u].id);
  });

  let b = { id: "", draft: draftSchema.parse(B) };
  let c = { id: "", draft: draftSchema.parse(C) };
  await check("SUB", "Trois dossiers soumis par le porteur", async () => {
    b = await saveLand(users.owner.client, users.owner.id, B, 7);
    c = await saveLand(users.owner.client, users.owner.id, C, 7);
    await recompute(b.id, b.draft, media1);
    await recompute(c.id, c.draft, media1);
    for (const id of [a.id, b.id, c.id]) {
      const { error } = await users.owner.client.from("lands").update({ status: "submitted", submitted_at: new Date().toISOString() }).eq("id", id);
      assert(!error, `soumission : ${error?.message}`);
    }
    const { error } = await users.owner.client.from("lands").update({ status: "published" }).eq("id", a.id);
    assert(error, "le porteur a pu publier lui-même");
  });

  await check("18", "Document foncier privé : un autre utilisateur ne peut pas le lire", async () => {
    const path = `${a.id}/titre-${RUN}.pdf`;
    const { error: up } = await users.owner.client.storage.from("land-documents").upload(path, new Blob(["%PDF-1.4 test"], { type: "application/pdf" }));
    assert(!up, `dépôt : ${up?.message}`);
    uploaded.push(path);
    await users.owner.client.from("land_documents").insert({ land_id: a.id, kind: "title", storage_path: path, uploaded_by: users.owner.id });
    const other = await users.owner2.client.storage.from("land-documents").download(path);
    assert(other.error, "un autre porteur a pu télécharger le titre");
    const inv = await users.investor.client.from("land_documents").select("id").eq("land_id", a.id);
    assert((inv.data ?? []).length === 0, "un investisseur voit la liste des pièces");
    const adm = await users.admin.client.storage.from("land-documents").download(path);
    assert(!adm.error, "l'admin ne peut pas lire la pièce");
  });

  await check("11", "Même numéro de titre chez un autre porteur → alerte admin", async () => {
    const dup = await saveLand(users.owner2.client, users.owner2.id, { ...A, name: `[TEST ${RUN}] doublon`, title: { ...A.title, number: ` e2e-${RUN}-12 ` } }, 2);
    const { data } = await users.admin.client.from("admin_alerts").select("payload").eq("kind", "duplicate_title").eq("land_id", dup.id);
    assert((data ?? []).length > 0, "pas d'alerte de doublon");
    const own = await users.owner2.client.from("admin_alerts").select("id");
    assert((own.data ?? []).length === 0, "un porteur voit les alertes admin");
  });

  await check("12", "L'admin fait avancer le dossier : statut journalisé avec note, porteur notifié", async () => {
    const { error } = await users.admin.client.rpc("admin_set_status", { p_land: c.id, p_status: "info_requested", p_note: "Ajoutez une photo" });
    assert(!error, `admin_set_status : ${error?.message}`);
    const notOwner = await users.owner.client.rpc("admin_set_status", { p_land: c.id, p_status: "published", p_note: null });
    assert(notOwner.error, "un porteur a pu appeler admin_set_status");
    const { data: h } = await users.owner.client.from("land_status_history").select("to_status, note").eq("land_id", c.id).order("id", { ascending: false }).limit(1);
    assert(h?.[0]?.note === "Ajoutez une photo", "note absente de l'historique");
    const { data: n } = await users.owner.client.from("notifications").select("title, body").order("id", { ascending: false }).limit(1);
    assert(n?.[0]?.title.includes("Informations à compléter"), "notification absente");
  });

  await check("10", "Titre saisi = « déclaré » ; « vérifié » seulement par l'admin", async () => {
    const { data } = await service.from("lands").select("title_proof").eq("id", a.id).single();
    assert(data?.title_proof === "document" || data?.title_proof === "declared", `attendu déclaré, reçu ${data?.title_proof}`);
    const { error } = await users.owner.client.from("lands").update({ title_proof: "verified" }).eq("id", a.id);
    assert(error, "le porteur a pu marquer son titre vérifié");
    await users.admin.client.from("land_titles").update({ verified_by: users.admin.id, verified_at: new Date().toISOString(), verification_notes: "Pièces conformes" }).eq("land_id", a.id);
    const { error: e2 } = await users.admin.client.from("lands").update({ title_proof: "verified" }).eq("id", a.id);
    assert(!e2, `admin : ${e2?.message}`);
    const r = await recompute(a.id, a.draft, media1);
    assert(r.reason.startsWith("Titre vérifié"), `raison : ${r.reason}`);
  });

  await check("13", "Publication par l'admin : les terrains apparaissent dans le catalogue public", async () => {
    for (const id of [a.id, b.id, c.id]) {
      const { error } = await users.admin.client.rpc("admin_set_status", { p_land: id, p_status: "published", p_note: null });
      assert(!error, `publication : ${error?.message}`);
    }
    await users.admin.client.from("land_offers").update({ verdolive_fee_note: "Commission de 3 % à la signature" }).eq("land_id", b.id);
    const { data } = await anon.from("catalog_lands").select("id").in("id", [a.id, b.id, c.id]);
    assert(data?.length === 3, `${data?.length ?? 0} terrains visibles sur 3`);
  });

  await check("8", "Tri « Recommandés » : titre+eau, puis un seul, puis aucun (masqué)", async () => {
    const { data } = await anon.from("catalog_lands").select("*").in("id", [a.id, b.id, c.id]);
    const items = (data ?? []).map((r) => rowToItem(r));
    const def = applyFilters(items, DEFAULT_FILTERS);
    assert(def.items.map((l) => l.id).join() === [a.id, b.id].join(), "ordre ou masquage incorrect");
    assert(def.hiddenLow === 1, "le terrain sans titre ni eau n'est pas masqué");
    const all = applyFilters(items, { ...DEFAULT_FILTERS, tous: true });
    assert(all.items.at(-1)?.id === c.id, "le cas D n'est pas en dernier");
    const live = await page("/catalogue");
    const ia = live.html.indexOf(`/terrains/${a.id}`);
    const ib = live.html.indexOf(`/terrains/${b.id}`);
    assert(ia > 0 && ib > ia, "ordre incorrect sur le site en ligne");
    assert(!live.html.includes(`/terrains/${c.id}`), "le cas D est visible par défaut sur le site");
    return "vérifié dans la base et sur le site en ligne";
  });

  await check("9", "Filtres « Avec titre » ET « Avec eau » : compteur exact sur le site", async () => {
    const live = await page("/catalogue?titre=avec&eau=avec");
    assert(live.html.includes(`/terrains/${a.id}`), "terrain A absent");
    assert(!live.html.includes(`/terrains/${b.id}`), "terrain B (sans eau) présent");
    const { data } = await anon.from("catalog_lands").select("*");
    const expected = applyFilters((data ?? []).map((r) => rowToItem(r)), { ...DEFAULT_FILTERS, titre: "avec", eau: "avec" }).total;
    assert(new RegExp(`>${expected}</strong> terrain`).test(live.html), `compteur attendu ${expected}`);
  });

  await check("21", "Eau partagée et indivision affichées sur la fiche publique", async () => {
    await users.owner.client.from("land_water").update({ shared: "yes", shared_details: "Tour d'eau le mardi" }).eq("land_id", a.id);
    const pa = await page(`/terrains/${a.id}`);
    assert(pa.html.includes("Tour d&#x27;eau le mardi") || pa.html.includes("Tour d'eau le mardi"), "précision eau partagée absente");
    assert(pa.html.includes("Titre vérifié"), "badge Titre vérifié absent");
    const pb = await page(`/terrains/${b.id}`);
    assert(pb.html.includes("accord des indivisaires déclaré"), "mention indivision absente");
    assert(!pa.html.includes(`E2E-${RUN}`), "le numéro de titre est exposé publiquement");
  });

  await check("19", "Visite refusée sans charte, acceptée après, visible du porteur", async () => {
    const ins = () => users.investor.client.from("visit_requests").insert({ land_id: a.id, investor_id: users.investor.id, message: "Visite test" });
    const r1 = await ins();
    assert(r1.error, "visite acceptée sans charte");
    await users.investor.client.from("profiles").update({ charter_accepted_at: new Date().toISOString() }).eq("id", users.investor.id);
    const r2 = await ins();
    assert(!r2.error, `visite après charte : ${r2.error?.message}`);
  });

  await check("14", "Favori enregistré ; demande de visite visible du porteur et de l'admin", async () => {
    const f = await users.investor.client.from("favorites").insert({ user_id: users.investor.id, land_id: a.id });
    assert(!f.error, `favori : ${f.error?.message}`);
    const o = await users.owner.client.from("visit_requests").select("id").eq("land_id", a.id);
    const ad = await users.admin.client.from("visit_requests").select("id").eq("land_id", a.id);
    assert(o.data?.length === 1 && ad.data?.length === 1, "visite invisible");
    const p = await users.owner.client.from("profiles").select("full_name").eq("id", users.investor.id).single();
    assert(p.data?.full_name === "Investisseur Test", "le porteur ne voit pas le demandeur");
    const n = await users.owner.client.from("notifications").select("kind").eq("kind", "visit_request");
    assert((n.data ?? []).length > 0, "pas de notification de visite");
  });

  await check("22", "Signalement : ticket créé, alerte dans la file admin", async () => {
    const { data, error } = await service.from("reports").insert({ land_id: b.id, reporter_id: users.investor.id, category: "land_conflict", message: `[TEST ${RUN}] litige limite nord` }).select("id").single();
    assert(!error && data, `signalement : ${error?.message}`);
    const al = await users.admin.client.from("admin_alerts").select("id").eq("kind", "report").eq("land_id", b.id);
    assert((al.data ?? []).length > 0, "pas d'alerte admin");
    const other = await users.owner2.client.from("reports").select("id").eq("id", data.id);
    assert((other.data ?? []).length === 0, "un autre utilisateur lit le signalement");
    return `ticket S-${String(data.id).slice(0, 8).toUpperCase()}`;
  });

  await check("23", "Partenariat Mgharsa : contributions, répartition et frais sur la fiche", async () => {
    const pb = await page(`/terrains/${b.id}`);
    // sans compte, la fiche complète est masquée (D8) : vérification via la vue publique
    const { data } = await anon.from("catalog_lands").select("owner_contribution, investor_contribution, owner_share_pct, verdolive_fee_note").eq("id", b.id).single();
    assert(data?.owner_share_pct == 40 && data.investor_contribution.includes("Financement") && data.verdolive_fee_note?.includes("3 %"), "données Mgharsa incomplètes");
    assert(pb.html.includes("40 % propriétaire"), "répartition absente de la fiche publique");
    return "affichage détaillé réservé aux comptes (D8)";
  });

  await check("15-16", "Diagnostic GeoAI : scores séparés, données mesurées / estimées / déclarées", async () => {
    const d = await diagnose({ lat: 36.58, lng: 10.86, areaHa: 20, exploitableAreaHa: 18, water: { available: true, yearRound: true, salinityGL: 1.2, flowLs: 4, flowNature: "measured" }, declaredCrops: "Olivier" });
    assert(d.dataPoints.some((p) => p.nature === "estimé") && d.dataPoints.some((p) => p.nature === "mesuré"), "natures des données absentes");
    const ins = await users.admin.client.from("land_diagnostics").upsert({ land_id: a.id, data: d, agri_score: d.agriScore, status: "auto" });
    assert(!ins.error, `enregistrement : ${ins.error?.message}`);
    const before = await anon.from("land_diagnostics").select("land_id").eq("land_id", a.id);
    assert((before.data ?? []).length === 0, "diagnostic non validé visible du public");
    await users.admin.client.from("land_diagnostics").update({ status: "validated", validated_by: users.admin.id, validated_at: new Date().toISOString() }).eq("land_id", a.id);
    await users.admin.client.from("lands").update({ score_agri: d.agriScore }).eq("id", a.id);
    const after = await anon.from("land_diagnostics").select("agri_score").eq("land_id", a.id);
    assert(after.data?.[0]?.agri_score === d.agriScore, "diagnostic validé invisible");
    const { data: s } = await anon.from("catalog_lands").select("score_legal, score_water, score_agri, score_completeness").eq("id", a.id).single();
    assert(s && s.score_agri === d.agriScore, "scores séparés incomplets");
    return `${d.summary} Scores : juridique ${s.score_legal}, hydrique ${s.score_water}, agricole ${s.score_agri}, complétude ${s.score_completeness}`;
  });

  await check("17", "Rapport PDF : réservé aux comptes connectés", async () => {
    const r = await page(`/terrains/${a.id}/rapport`);
    assert(r.status === 307 && r.location.includes("/connexion"), `attendu redirection vers la connexion, reçu ${r.status}`);
    return "génération du PDF couverte par le test automatique (rapport de 2 pages)";
  });

  await check("SEC", "Pages privées protégées sur le site en ligne", async () => {
    for (const p of ["/admin", "/compte", "/espace-porteur"]) {
      const r = await page(p);
      assert(r.status === 307 && r.location.includes("/connexion"), `${p} : ${r.status}`);
    }
    const t = await anon.from("land_titles").select("number").limit(1);
    assert((t.data ?? []).length === 0, "numéros de titre lisibles sans compte");
  });

  // ------------------------------------------------------------------
  // Pages connectées, filtres, liens e-mail, réglages, sécurité
  // ------------------------------------------------------------------
  await check("INS", "Inscription par l'API publique : compte créé et connecté immédiatement (INS-05)", async () => {
    const settings = await fetch(`${URL_}/auth/v1/settings`, { headers: { apikey: ANON } }).then((r) => r.json());
    assert(settings.mailer_autoconfirm === true, "« Confirm email » est activé dans Supabase : le désactiver");
    const c = createClient(URL_, ANON, { auth: { persistSession: false } });
    const { data, error } = await c.auth.signUp({ email: `e2e-${RUN}-signup@verdolive.test`, password: randomBytes(18).toString("base64url"), options: { data: { full_name: "Nouvel Inscrit", role: "owner" } } });
    if (data.user) extraUserIds.push(data.user.id);
    assert(!error, `inscription : ${error?.message}`);
    assert(data.session, "pas de session immédiate");
    const { data: p } = await c.from("profiles").select("roles, email_verified_at").eq("id", data.user!.id).single();
    assert(p?.roles?.[0] === "owner" && p.email_verified_at === null, "profil incorrect");
  });

  await check("LIEN", "Lien e-mail de confirmation sur le site en ligne : adresse vérifiée et redirection", async () => {
    const id = extraUserIds[0];
    assert(id, "dépend du test d'inscription");
    const { data, error } = await service.auth.admin.generateLink({ type: "magiclink", email: `e2e-${RUN}-signup@verdolive.test` });
    assert(!error, `génération du lien : ${error?.message}`);
    const r = await page(`/auth/confirm?token_hash=${data.properties!.hashed_token}&type=magiclink`);
    assert(r.status === 307 && r.location.includes("/espace-porteur") && r.location.includes("verifie=1"), `redirection : ${r.status} ${r.location}`);
    const { data: p } = await service.from("profiles").select("email_verified_at").eq("id", id).single();
    assert(p?.email_verified_at, "adresse non marquée vérifiée (clé serveur sur Vercel ?)");
    const again = await page(`/auth/confirm?token_hash=${data.properties!.hashed_token}&type=magiclink`);
    assert(again.location.includes("/auth/erreur"), "un lien déjà utilisé est accepté");
  });

  await check("MDP", "Lien de réinitialisation : arrive sur le choix du nouveau mot de passe", async () => {
    const { data, error } = await service.auth.admin.generateLink({ type: "recovery", email: users.investor.email });
    assert(!error, error?.message ?? "");
    const r = await page(`/auth/confirm?token_hash=${data.properties!.hashed_token}&type=recovery`);
    assert(r.location.includes("/compte/nouveau-mot-de-passe"), `redirection : ${r.status} ${r.location}`);
  });

  await check("INS-09", "Un même compte ajoute le profil porteur sans nouvelle inscription", async () => {
    const { error } = await users.investor.client.from("profiles").update({ roles: ["investor", "owner"] }).eq("id", users.investor.id);
    assert(!error, error?.message ?? "");
  });

  await check("PHOTO", "Photo déposée par le porteur, affichée sur la fiche publique", async () => {
    const path = `${a.id}/photo-${RUN}.png`;
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
    const { error } = await users.owner.client.storage.from("land-photos").upload(path, new Blob([png], { type: "image/png" }));
    assert(!error, `dépôt : ${error?.message}`);
    photos.push(path);
    await users.owner.client.from("land_photos").insert({ land_id: a.id, storage_path: path, position: 0 });
    const r = await page(`/terrains/${a.id}`);
    const m = r.html.match(/https:[^"' \\]*object\/sign\/land-photos[^"' \\]*/);
    assert(m, "photo absente de la fiche");
    const img = await fetch(m[0]);
    assert(img.ok, `photo illisible : HTTP ${img.status}`);
  });

  await check("P-INV", "Pages investisseur connectées (fiche complète, favoris, visites, compte)", async () => {
    await expectPage(`/terrains/${a.id}`, "investor", ["Indicateurs du dossier", "Conditions proposées", "Aptitude par culture", "Pression sur", "Étude économique", "Télécharger le rapport PDF", "Frais VerdOlive"]);
    await expectPage(`/terrains/${b.id}`, "investor", ["Partage de la valeur envisagé", "Contribution", "Financement", "Commission de 3 %"]);
    await expectPage("/catalogue", "investor", [`/terrains/${a.id}`]);
    await expectPage("/carte", "investor", ["Carte des terrains"]);
    await expectPage("/compte", "investor", ["Mon compte", "Mes profils", "Mes informations"]);
    await expectPage("/compte/favoris", "investor", [`/terrains/${a.id}`]);
    await expectPage("/compte/visites", "investor", ["Mes demandes de visite", `[TEST ${RUN}] Oliveraie`]);
    await expectPage("/compte/notifications", "investor", ["Notifications"]);
    await expectPage("/compte/nouveau-mot-de-passe", "investor", ["Nouveau mot de passe"]);
  });

  await check("17b", "Rapport PDF téléchargé par un compte connecté", async () => {
    const res = await fetch(`${SITE}/terrains/${a.id}/rapport`, { headers: { cookie: users.investor.cookie } });
    const bytes = Buffer.from(await res.arrayBuffer());
    assert(res.status === 200, `HTTP ${res.status}`);
    assert(bytes.subarray(0, 4).toString() === "%PDF", "le fichier n'est pas un PDF");
    return `${Math.round(bytes.length / 1024)} Ko`;
  });

  await check("P-OWN", "Pages porteur connectées (espace, assistant, reprise de brouillon, visites, notifications)", async () => {
    const draft = await saveLand(users.owner.client, users.owner.id, { ...A, name: `[TEST ${RUN}] brouillon`, title: { answer: "unknown" } }, 4);
    await expectPage("/espace-porteur", "owner", ["Bonjour Porteur", `[TEST ${RUN}] brouillon`, "Reprendre"]);
    await expectPage("/espace-porteur/terrains/nouveau", "owner", ["Votre objectif", "sur 7"]);
    await expectPage(`/espace-porteur/terrains/${draft.id}`, "owner", ["Étape 4 sur 7", "État du terrain"]);
    await expectPage(`/espace-porteur/terrains/${a.id}`, "owner", ["Statut", "Publié"]);
    await expectPage("/espace-porteur/visites", "owner", ["Investisseur Test", "Visite test"]);
    await expectPage("/compte/notifications", "owner", ["Nouvelle demande de visite"]);
    const other = await page(`/espace-porteur/terrains/${draft.id}`, users.owner2.cookie);
    assert(!other.html.includes(`[TEST ${RUN}] brouillon`), "un autre porteur voit le brouillon");
  });

  await check("P-ADM", "Pages administrateur connectées (tableau de bord, dossier, signalements, réglages)", async () => {
    await expectPage("/admin", "admin", ["Tableau de bord", "File de vérification", "Alertes"]);
    await expectPage("/admin/terrains", "admin", [`[TEST ${RUN}] Oliveraie`]);
    await expectPage(`/admin/terrains/${a.id}`, "admin", ["Titre foncier (privé)", `E2E-${RUN}/12`, "Diagnostic GeoAI", "Historique", "Pièces justificatives"]);
    await expectPage(`/admin/terrains/${b.id}`, "admin", ["Traitement du dossier"]);
    await expectPage("/admin/signalements", "admin", [`[TEST ${RUN}] litige limite nord`]);
    await expectPage("/admin/reglages", "admin", ["Ordre du tri"]);
    for (const who of ["investor", "owner2"] as const) {
      const r = await page("/admin", users[who].cookie);
      assert(r.status === 404 || r.html.includes("Page introuvable"), `${who} accède à /admin (HTTP ${r.status})`);
      assert(!r.html.includes("File de vérification"), `${who} reçoit le contenu du tableau de bord (HTTP ${r.status})`);
    }
  });

  await check("FILTRES", "Filtres et tris sur le site en ligne identiques au calcul attendu", async () => {
    const queries = [
      "", "titre=verifie", "eau=avec", "eau=preuve", "offre=sale", "offre=rent,partnership", "gouv=nabeul", "gouv=kairouan&deleg=kairouan-haffouz",
      "surfMin=25", "surfMax=18", "budMax=10000&tous=1", "budMin=500000", "source=well", "dispo=year_round", "debitMin=5", "foncier=verified",
      "culture=olivier", "plantations=oui", "statut=low", "potentielMin=50", "tous=1&tri=prix_asc", "tous=1&tri=prix_desc", "tous=1&tri=surface_asc",
      "tous=1&tri=surface_desc", "tri=recents", "tri=debit", "tri=potentiel",
    ];
    const { data } = await anon.from("catalog_lands").select("*");
    const items = (data ?? []).map((r) => rowToItem(r));
    const bad: string[] = [];
    for (const q of queries) {
      const expected = applyFilters(items, parseFilters(Object.fromEntries(new URLSearchParams(q)))).items.map((l) => l.id);
      const r = await page(`/catalogue?${q}`);
      const body = r.html.replace(/<script[\s\S]*?<\/script>/g, "");
      const shown = [...new Set([...body.matchAll(/href="\/terrains\/([0-9a-f-]{36})"/g)].map((m) => m[1]))];
      if (r.status !== 200 || shown.join() !== expected.join()) bad.push(`${q || "(défaut)"} : ${shown.length} au lieu de ${expected.length}`);
    }
    assert(bad.length === 0, bad.join(" ; "));
    return `${queries.length} combinaisons`;
  });

  await check("CLA-04", "L'admin modifie les réglages : le catalogue en tient compte", async () => {
    originalSettings = (await service.from("settings").select("key, value")).data ?? [];
    const { error } = await users.admin.client.from("settings").upsert({ key: "catalog.show_low_by_default", value: true, updated_by: users.admin.id });
    assert(!error, error?.message ?? "");
    const r = await page("/catalogue");
    assert(r.html.includes(`/terrains/${c.id}`), "le réglage n'est pas appliqué");
    const no = await users.investor.client.from("settings").update({ value: false }).eq("key", "catalog.show_low_by_default").select();
    assert((no.data ?? []).length === 0, "un investisseur a modifié les réglages");
  });

  await check("SEC-2", "Écritures interdites entre utilisateurs et sans compte", async () => {
    const u1 = await users.owner2.client.from("lands").update({ title: "piraté" }).eq("id", a.id).select();
    assert((u1.data ?? []).length === 0, "un autre porteur modifie le terrain");
    const u2 = await users.owner2.client.from("land_titles").select("number").eq("land_id", a.id);
    assert((u2.data ?? []).length === 0, "un autre porteur lit le numéro de titre");
    const u3 = await users.owner2.client.storage.from("land-photos").upload(`${a.id}/intrus-${RUN}.png`, new Blob(["x"], { type: "image/png" }));
    assert(u3.error, "un autre porteur dépose une photo");
    const u4 = await anon.from("lands").insert({ owner_id: users.owner.id }).select();
    assert(u4.error, "création sans compte possible");
    const u5 = await users.investor.client.from("land_diagnostics").update({ status: "validated" }).eq("land_id", a.id).select();
    assert((u5.data ?? []).length === 0, "un investisseur modifie le diagnostic");
    const u6 = await users.investor.client.from("profiles").select("id");
    assert((u6.data ?? []).length === 1, "un investisseur lit les profils des autres");
  });

  await check("PUB", "Pages publiques, plan du site et pages inexistantes", async () => {
    for (const p of ["/", "/catalogue", "/carte", "/inscription", "/connexion", "/mot-de-passe-oublie", "/conditions", "/confidentialite", "/charte", "/credits", "/robots.txt", "/sitemap.xml", "/vendor/mapbox-gl-rtl-text.js"]) {
      const r = await page(p);
      assert(r.status === 200, `${p} : HTTP ${r.status}`);
    }
    for (const p of ["/inexistant", "/terrains/00000000-0000-4000-8000-999999999999", "/dev/assistant"]) {
      const r = await page(p);
      assert(r.status === 404 || r.html.includes("Page introuvable"), `${p} : HTTP ${r.status}`);
    }
  });
}

async function cleanup() {
  console.log("\nNettoyage…");
  const ids = [...Object.values(users).map((u) => u.id), ...extraUserIds];
  for (const s of originalSettings) await service.from("settings").update({ value: s.value, updated_by: null }).eq("key", s.key);
  if (photos.length) await service.storage.from("land-photos").remove(photos);
  if (uploaded.length) await service.storage.from("land-documents").remove(uploaded);
  const { data: owned } = ids.length ? await service.from("lands").select("id").in("owner_id", ids) : { data: [] };
  const allLands = [...new Set([...landIds, ...(owned ?? []).map((l) => l.id)])];
  await service.from("reports").delete().like("message", `[TEST ${RUN}]%`);
  if (allLands.length) await service.from("lands").delete().in("id", allLands);
  if (ids.length) {
    await service.from("audit_log").delete().in("actor_id", ids);
    await service.from("settings").update({ updated_by: null }).in("updated_by", ids);
  }
  for (const id of ids) {
    const { error } = await service.auth.admin.deleteUser(id);
    if (error) console.log(`  ⚠️ compte ${id} : ${error.message}`);
  }
  const left = await service.from("lands").select("id", { count: "exact", head: true }).like("title", `[TEST ${RUN}]%`);
  const leftUsers = (await service.auth.admin.listUsers({ perPage: 1000 })).data?.users.filter((u) => u.email?.includes(`e2e-${RUN}`)).length ?? 0;
  console.log(`  terrains de test restants : ${left.count ?? 0} · comptes de test restants : ${leftUsers}`);
}

try {
  await main();
} finally {
  await cleanup();
  const ok = results.filter((r) => r.ok).length;
  console.log(`\nRésultat : ${ok}/${results.length} vérifications réussies.`);
  process.exitCode = ok === results.length ? 0 : 1;
}
