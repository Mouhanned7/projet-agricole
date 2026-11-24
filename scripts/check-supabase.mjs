import { readFileSync } from "node:fs";
// Vérifie la configuration Supabase sans afficher les clés. Usage : npm run check:supabase
import { createClient } from "@supabase/supabase-js";
const env = Object.fromEntries(readFileSync(process.argv[2] ?? ".env.local", "utf8").split("\n").filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]));
const url = env.NEXT_PUBLIC_SUPABASE_URL, anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY, secret = env.SUPABASE_SERVICE_ROLE_KEY;
const ok = (b, msg) => console.log(`${b ? "✅" : "❌"} ${msg}`);

const settings = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: anonKey } });
ok(settings.ok, `Clé publique acceptée par l'authentification (HTTP ${settings.status})`);
if (settings.ok) {
  const s = await settings.json();
  ok(s.external?.email, "Connexion par e-mail activée");
  ok(s.mailer_autoconfirm === true, `« Confirm email » désactivé (attendu) : ${s.mailer_autoconfirm ? "oui" : "NON, encore activé"}`);
  console.log(`ℹ️  Google : ${s.external?.google ? "activé" : "non configuré (facultatif)"}`);
  ok(!s.disable_signup, "Inscriptions ouvertes");
}

const anon = createClient(url, anonKey, { auth: { persistSession: false } });
const g = await anon.from("governorates").select("id", { count: "exact", head: true });
ok(!g.error, `Schéma installé (table governorates) ${g.error ? "→ " + g.error.message : `: ${g.count} gouvernorats`}`);
const cat = await anon.from("catalog_lands").select("id", { count: "exact", head: true });
ok(!cat.error, `Vue catalogue publique ${cat.error ? "→ " + cat.error.message : `: ${cat.count} terrains publiés`}`);
const t = await anon.from("land_titles").select("number").limit(1);
ok(!t.error ? (t.data ?? []).length === 0 : true, "Titres fonciers invisibles pour un visiteur (sécurité)");

const admin = createClient(url, secret, { auth: { persistSession: false } });
const p = await admin.from("profiles").select("id, roles", { count: "exact" });
ok(!p.error, `Clé secrète acceptée ${p.error ? "→ " + p.error.message : `: ${p.count} profil(s), dont ${(p.data ?? []).filter((x) => x.roles?.includes("admin")).length} admin`}`);
const b = await admin.storage.listBuckets();
const names = (b.data ?? []).map((x) => x.id);
ok(names.includes("land-photos") && names.includes("land-documents"), `Stockage des fichiers ${b.error ? "→ " + b.error.message : `: ${names.join(", ") || "aucun bucket"}`}`);
