/**
 * Génère supabase/seed.sql à partir du référentiel et des terrains de démo.
 * Usage : npm run seed:generate
 */
import { writeFileSync } from "node:fs";
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
const out: string[] = ["-- Généré par scripts/generate-seed.ts — ne pas modifier à la main.", ""];

out.push("insert into governorates (id, name_fr, name_ar) values");
out.push(GOVERNORATES.map((g) => `  (${q(g.id)}, ${q(g.fr)}, ${q(g.ar)})`).join(",\n") + "\non conflict (id) do nothing;\n");

out.push("insert into delegations (id, governorate_id, name_fr) values");
out.push(
  GOVERNORATES.flatMap((g) => g.delegations.map((d) => `  (${q(delegationId(g.id, d))}, ${q(g.id)}, ${q(d)})`)).join(",\n") +
    "\non conflict (id) do nothing;\n",
);

out.push("-- Comptes de démonstration (environnement local uniquement)");
out.push(`insert into auth.users (id, email) values (${q(DEMO_OWNER)}, 'porteur.demo@verdolive.test'), (${q(DEMO_ADMIN)}, 'admin.demo@verdolive.test') on conflict do nothing;`);
out.push(`insert into profiles (id, full_name, roles) values (${q(DEMO_OWNER)}, 'Porteur Démo', '{owner}'), (${q(DEMO_ADMIN)}, 'Admin Démo', '{admin}') on conflict do nothing;\n`);

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

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), out.join("\n"));
console.log(`seed.sql : ${GOVERNORATES.length} gouvernorats, ${DEMO_LANDS.length} terrains`);
