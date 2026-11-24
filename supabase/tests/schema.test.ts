/**
 * Valide les migrations et les règles de sécurité sur un Postgres embarqué
 * (PGlite), avec une imitation minimale du schéma `auth` de Supabase.
 */
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { draftSchema, fromRows, toRows } from "../../src/lib/lands/draft";

const root = new URL("../", import.meta.url);
const sql = (p: string) => readFileSync(new URL(p, root), "utf8");

const OWNER = "00000000-0000-4000-9000-000000000001";
const ADMIN = "00000000-0000-4000-9000-000000000002";
const INVESTOR = "00000000-0000-4000-9000-000000000003";
const OTHER_OWNER = "00000000-0000-4000-9000-000000000004";
const CAP_BON = "00000000-0000-4000-8000-000000000001";

let db: PGlite;

async function as<T = Record<string, unknown>>(user: string | null, query: string, params: unknown[] = []) {
  return db.transaction(async (tx) => {
    if (user === "service") await tx.exec(`set local role service_role`);
    else {
      await tx.exec(`set local role ${user ? "authenticated" : "anon"}`);
      await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [user ?? ""]);
    }
    return (await tx.query<T>(query, params)).rows;
  });
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}', raw_app_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
  `);
  await db.exec(sql("migrations/20261124000001_init.sql"));
  await db.exec(sql("migrations/20261124000003_auth.sql"));
  await db.exec(sql("migrations/20261124000004_reference.sql"));
  await db.exec(sql("seed.sql"));
  await db.exec(`
    grant usage on schema public to anon, authenticated, service_role;
    grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
    grant select, insert on reports to anon;
    grant usage on all sequences in schema public to anon, authenticated, service_role;
    insert into auth.users (id, email, raw_user_meta_data) values
      ('${INVESTOR}', 'invest@test.tn', '{"full_name": "Investisseur", "role": "investor"}'),
      ('${OTHER_OWNER}', 'autre@test.tn', '{"full_name": "Autre porteur", "role": "owner"}');
    update profiles set email_verified_at = now() where id = '${OTHER_OWNER}';
    insert into land_documents (land_id, kind, storage_path, uploaded_by) values ('${CAP_BON}', 'title', '${CAP_BON}/titre.pdf', '${OWNER}');
  `);
}, 60_000);

describe("catalogue public (D2)", () => {
  it("un visiteur sans compte voit les terrains publiés, triables", async () => {
    const rows = await as<{ title: string }>(null, `select title from catalog_lands`);
    expect(rows.length).toBe(7);
  });

  it("un visiteur ne peut pas lire les titres fonciers", async () => {
    await expect(as(null, `select number from land_titles`)).rejects.toThrow(/permission denied/);
    const rows = await as(INVESTOR, `select number from land_titles`);
    expect(rows).toHaveLength(0);
  });
});

describe("règles de sécurité (§13.1)", () => {
  it("scénario 18 : un autre utilisateur ne voit pas les documents fonciers", async () => {
    expect(await as(OTHER_OWNER, `select * from land_documents`)).toHaveLength(0);
    expect(await as(OWNER, `select * from land_documents`)).toHaveLength(1);
    expect(await as(ADMIN, `select * from land_documents`)).toHaveLength(1);
  });

  it("CLA-05 : un porteur ne peut pas marquer son titre comme vérifié", async () => {
    const id = "00000000-0000-4000-8000-000000000002";
    await expect(as(OWNER, `update lands set title_proof = 'verified' where id = $1`, [id])).rejects.toThrow(/administration/);
    await as(ADMIN, `update lands set title_proof = 'verified' where id = $1`, [id]);
    const [row] = await as<{ title_proof: string }>(ADMIN, `select title_proof from lands where id = $1`, [id]);
    expect(row.title_proof).toBe("verified");
  });

  it("CLA-01 : un porteur ne peut pas modifier son classement, le serveur oui", async () => {
    const id = "00000000-0000-4000-8000-000000000007";
    await expect(as(OWNER, `update lands set ranking_status = 'priority' where id = $1`, [id])).rejects.toThrow(/calculé/);
    await as("service", `update lands set score_completeness = 99 where id = $1`, [id]);
  });

  it("un porteur ne peut pas publier lui-même", async () => {
    const [land] = await as<{ id: string }>(OWNER,
      `insert into lands (owner_id, objective) values ($1, 'sale') returning id`, [OWNER]);
    await as(OWNER, `update lands set status = 'submitted' where id = $1`, [land.id]);
    await expect(as(OWNER, `update lands set status = 'published' where id = $1`, [land.id])).rejects.toThrow(/réservé/);
    const hist = await as(OWNER, `select to_status from land_status_history where land_id = $1`, [land.id]);
    expect(hist).toEqual([{ to_status: "submitted" }]);
  });

  it("scénario 11 : un numéro de titre en doublon crée une alerte admin", async () => {
    const [land] = await as<{ id: string }>(OTHER_OWNER,
      `insert into lands (owner_id, objective) values ($1, 'sale') returning id`, [OTHER_OWNER]);
    await as(OTHER_OWNER, `insert into land_titles (land_id, answer, number) values ($1, 'yes', ' 45127-12 ')`, [land.id]);
    const alerts = await as<{ payload: { other_land_id: string } }>(ADMIN,
      `select payload from admin_alerts where kind = 'duplicate_title' and land_id = $1`, [land.id]);
    expect(alerts[0].payload.other_land_id).toBe(CAP_BON);
    expect(await as(OTHER_OWNER, `select * from admin_alerts`)).toHaveLength(0);
  });

  it("scénario 19 / RES-01 : pas de demande de visite sans la charte", async () => {
    const insert = `insert into visit_requests (land_id, investor_id) values ($1, $2)`;
    await expect(as(INVESTOR, insert, [CAP_BON, INVESTOR])).rejects.toThrow(/row-level security/);
    await as(INVESTOR, `update profiles set charter_accepted_at = now() where id = $1`, [INVESTOR]);
    // D7 : la charte ne suffit pas, l'e-mail doit être confirmé
    await expect(as(INVESTOR, insert, [CAP_BON, INVESTOR])).rejects.toThrow(/row-level security/);
    await as("service", `update profiles set email_verified_at = now() where id = $1`, [INVESTOR]);
    await as(INVESTOR, insert, [CAP_BON, INVESTOR]);
    expect(await as(OWNER, `select * from visit_requests where land_id = $1`, [CAP_BON])).toHaveLength(1);
  });

  it("le serveur seul peut marquer l'e-mail comme vérifié", async () => {
    await expect(as(INVESTOR, `update profiles set email_verified_at = now() where id = $1`, [INVESTOR])).rejects.toThrow(/plateforme/);
  });
});

describe("inscription (Sprint 1)", () => {
  const NEW = "00000000-0000-4000-9000-000000000099";

  it("INS-01 / INS-09 : le profil est créé avec le rôle choisi, l'admin est refusé", async () => {
    await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, 'x@test.tn', $2)`, [
      NEW, JSON.stringify({ full_name: "  Amine Ben Ali ", role: "admin" }),
    ]);
    const [p] = await as<{ full_name: string; roles: string; email_verified_at: string | null }>(NEW,
      `select full_name, roles::text, email_verified_at from profiles where id = $1`, [NEW]);
    expect(p).toEqual({ full_name: "Amine Ben Ali", roles: "{}", email_verified_at: null });

    await as(NEW, `update profiles set roles = '{owner,investor}' where id = $1`, [NEW]);
    await expect(as(NEW, `update profiles set roles = '{owner,admin}' where id = $1`, [NEW])).rejects.toThrow(/administration/);
  });

  it("Google : adresse déjà vérifiée", async () => {
    const G = "00000000-0000-4000-9000-000000000098";
    await db.query(`insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data) values ($1, 'g@gmail.com', $2, $3)`, [
      G, JSON.stringify({ name: "Salma", role: "investor" }), JSON.stringify({ provider: "google" }),
    ]);
    const [p] = await as<{ full_name: string; roles: string; verified: boolean }>(G,
      `select full_name, roles::text, email_verified_at is not null as verified from profiles where id = $1`, [G]);
    expect(p).toEqual({ full_name: "Salma", roles: "{investor}", verified: true });
  });

  it("D7 : un porteur non vérifié ne peut pas soumettre son terrain", async () => {
    const [land] = await as<{ id: string }>(NEW, `insert into lands (owner_id, objective) values ($1, 'rent') returning id`, [NEW]);
    await expect(as(NEW, `update lands set status = 'submitted' where id = $1`, [land.id])).rejects.toThrow(/Confirmez votre adresse/);
    await as("service", `update profiles set email_verified_at = now() where id = $1`, [NEW]);
    await as(NEW, `update lands set status = 'submitted' where id = $1`, [land.id]);
  });
});

describe("assistant « Ajouter mon terrain » (Sprint 2)", () => {
  it("TER-05 : un brouillon complet s'enregistre et se relit à l'identique", async () => {
    const draft = draftSchema.parse({
      objective: "rent",
      name: "Verger d'amandiers",
      title: { answer: "no", altDocument: "adoulaire", registrationInProgress: "yes", ownership: "joint", jointOwnersAgree: true },
      water: { answer: "yes", sources: ["well", "borehole"], availability: "seasonal", flowValue: 2.5, flowUnit: "m3_h", flowMeasured: false, shared: "no" },
      location: { governorateId: "sidi-bouzid", delegationId: "sidi-bouzid-regueb", lat: 34.86, lng: 9.79, areaHa: 30, exploitableAreaHa: 25 },
      land: { state: "exploited", trees: [{ species: "Amandier", count: 1200, age: "12 ans" }], crops: "Amandes" },
      offer: { rentTnd: 18000, rentPeriod: "annuel", minDurationYears: 5, allowPlanting: true, renewable: true, notes: "Visite possible" },
    });
    const rows = toRows(draft);

    // Insère une ligne avec les noms de colonnes produits par toRows : une faute de nom échoue ici.
    const insert = async (table: string, row: Record<string, unknown>, extra: Record<string, unknown>) => {
      const all = { ...extra, ...row };
      const cols = Object.keys(all);
      const vals = cols.map((c) => {
        const v = all[c];
        return v !== null && typeof v === "object" && !Array.isArray(v) ? JSON.stringify(v) : Array.isArray(v) && c === "trees" ? JSON.stringify(v) : v;
      });
      const placeholders = cols.map((_, i) => "$" + (i + 1)).join(", ");
      return as<{ id?: string }>(OTHER_OWNER, `insert into ${table} (${cols.join(", ")}) values (${placeholders}) returning *`, vals);
    };

    const [land] = await insert("lands", rows.land, { owner_id: OTHER_OWNER, wizard_step: 4 });
    await insert("land_titles", rows.title, { land_id: land.id });
    await insert("land_water", rows.water, { land_id: land.id });
    await insert("land_offers", rows.offer, { land_id: land.id });

    const one = async (q: string) => (await as<Record<string, unknown>>(OTHER_OWNER, q, [land.id]))[0];
    const l = await one(`select * from lands where id = $1`);
    const t = await one(`select * from land_titles where land_id = $1`);
    const w = await one(`select * from land_water where land_id = $1`);
    const o = await one(`select * from land_offers where land_id = $1`);
    expect(fromRows(l, t, w, o)).toEqual(draft);
    expect(l.wizard_step).toBe(4);
  });
});
