// Vérifie la connexion SMTP sans envoyer d'e-mail ni afficher le mot de passe. Usage : npm run check:smtp
import { readFileSync } from "node:fs";
import nodemailer from "nodemailer";

const env = Object.fromEntries(
  readFileSync(process.argv[2] ?? ".env.local", "utf8")
    .split("\n")
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]),
);
const missing = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"].filter((k) => !env[k]);
if (missing.length) {
  console.log(`❌ Variables manquantes dans .env.local : ${missing.join(", ")}`);
  process.exit(1);
}
const port = Number(env.SMTP_PORT || 587);
const t = nodemailer.createTransport({ host: env.SMTP_HOST, port, secure: port === 465, auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } });
try {
  await t.verify();
  console.log(`✅ Connexion SMTP réussie (${env.SMTP_HOST}:${port}), expéditeur : ${env.EMAIL_FROM || env.SMTP_USER}`);
} catch (e) {
  console.log(`❌ Connexion SMTP refusée : ${e.message}`);
  process.exit(1);
}
