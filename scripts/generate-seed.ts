/**
 * Génère, à partir de src/lib/data :
 * - supabase/migrations/20261124000004_reference.sql : gouvernorats et délégations (production)
 * - supabase/seed.sql : comptes et terrains de démonstration (fictifs)
 * - supabase/setup/ : fichiers à coller dans le SQL Editor de Supabase
 * Usage : npm run seed:generate
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { GOVERNORATES, delegationId } from "../src/lib/data/tunisia";
import { DEMO_LANDS } from "../src/lib/data/demo-lands";

const q = (v: unknown): string => {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return `array[${v.map(q).join(", ")}]::text[]`;
  return `'${String(v).replace(/'/g, "''")}'`;
};

const DEMO_OWNER = "00000000-0000-4000-9000-000000000001";
const DEMO_ADMIN = "00000000-0000-4000-9000-000000000002";
const HEADER = "-- Généré par scripts/generate-seed.ts — ne pas modifier à la main.";
const ref: string[] = [HEADER, "-- Référentiel géographique de la Tunisie (nécessaire en production).", ""];
const out: string[] = [HEADER, "-- Données de démonstration FICTIVES. Ne pas charger en production.", ""];

ref.push("insert into governorates (id, name_fr, name_ar) values");
ref.push(GOVERNORATES.map((g) => `  (${q(g.id)}, ${q(g.fr)}, ${q(g.ar)})`).join(",\n") + "\non conflict (id) do nothing;\n");

ref.push("insert into delegations (id, governorate_id, name_fr) values");
ref.push(
  GOVERNORATES.flatMap((g) => g.delegations.map((d) => `  (${q(delegationId(g.id, d))}, ${q(g.id)}, ${q(d)})`)).join(",\n") +
    "\non conflict (id) do nothing;\n",
);

out.push("-- Comptes de démonstration (environnement local uniquement)");
out.push(`insert into auth.users (id, email) values (${q(DEMO_OWNER)}, 'porteur.demo@verdolive.test'), (${q(DEMO_ADMIN)}, 'admin.demo@verdolive.test') on conflict do nothing;`);
out.push(`insert into profiles (id, full_name, roles, email_verified_at) values (${q(DEMO_OWNER)}, 'Porteur Démo', '{owner}', now()), (${q(DEMO_ADMIN)}, 'Admin Démo', '{admin}', now())\n` +
  `  on conflict (id) do update set full_name = excluded.full_name, roles = excluded.roles, email_verified_at = excluded.email_verified_at;\n`);

for (const l of DEMO_LANDS) {
  const r = l.ranking;
  const delId = delegationId(l.governorateId, l.delegation);
  out.push(`-- ${l.name} : ${r.status} (${r.reason})`);
  out.push(
    `insert into lands (id, ref, owner_id, status, wizard_step, objective, title, governorate_id, delegation_id, lat, lng, area_ha, crops, ` +
      `ranking_status, ranking_reason, title_proof, water_proof, has_flow, score_legal, score_water, score_completeness, submitted_at, published_at) values (` +
      [l.id, l.ref, DEMO_OWNER, "published", 7, l.objective, l.name, l.governorateId, delId, l.lat, l.lng, l.areaHa, l.crops,
        r.status, r.reason, r.titleProof, r.waterProof, Boolean(l.water.flow), r.scores.legal, r.scores.water, r.scores.completeness,
        l.publishedAt, l.publishedAt].map(q).join(", ") +
      ");",
  );
  const t = l.title;
  out.push(
    `insert into land_titles (land_id, answer, number, ownership, joint_owners_agree, alt_document, registration_in_progress, verified_by, verified_at) values (` +
      [l.id, t.answer, t.number, t.ownership, t.jointOwnersAgree, t.altDocument, t.registrationInProgress,
        t.proof === "verified" ? DEMO_ADMIN : null, t.proof === "verified" ? l.publishedAt : null].map(q).join(", ") +
      ");",
  );
  const w = l.water;
  out.push(
    `insert into land_water (land_id, answer, sources, availability, flow_value, flow_unit, flow_nature, shared, shared_details, nearby_source, nearby_distance_km, rainfed) values (` +
      [l.id, w.answer, w.sources ?? [], w.availability, w.flow?.value, w.flow?.unit, w.flow?.nature, w.shared, w.sharedDetails,
        w.nearbySource, w.nearbyDistanceKm, w.rainfed].map(q).join(", ") +
      ");",
  );
  out.push(
    `insert into land_offers (land_id, price_tnd, rent_tnd, rent_period, partnership_type, owner_share_pct) values (` +
      [l.id, l.priceTnd, l.rentTnd, l.rentTnd ? "annuel" : null, l.objective === "partnership" ? "mgharsa" : null, l.ownerSharePct].map(q).join(", ") +
      ");\n",
  );
}

const root = new URL("../supabase/", import.meta.url);
writeFileSync(new URL("migrations/20261124000004_reference.sql", root), ref.join("\n"));
writeFileSync(new URL("seed.sql", root), out.join("\n"));

// Fichiers prêts à coller dans Supabase > SQL Editor
const migrations = readdirSync(new URL("migrations/", root)).filter((f) => f.endsWith(".sql")).sort();
const bundle = [
  "-- VerdOlive : schéma complet, à exécuter UNE fois dans Supabase > SQL Editor.",
  `-- ${HEADER.slice(3)}`,
  `-- Contient, dans l'ordre : ${migrations.join(", ")}`,
  "",
  ...migrations.map((f) => `-- ===== ${f} =====\n${readFileSync(new URL(`migrations/${f}`, root), "utf8")}`),
].join("\n");
writeFileSync(new URL("setup/1_schema_complet.sql", root), bundle);
writeFileSync(new URL("setup/2_demo_facultatif.sql", root), out.join("\n"));
console.log(`seed.sql : ${GOVERNORATES.length} gouvernorats, ${DEMO_LANDS.length} terrains`);
