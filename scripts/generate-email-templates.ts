/**
 * Génère les modèles d'e-mail à coller dans Supabase > Authentication > Emails.
 * Usage : npm run emails:generate
 *
 * Les liens utilisent {{ .SiteURL }} (réglage « Site URL » de Supabase) et
 * pointent vers /auth/confirm avec un jeton, ce qui fonctionne même si
 * l'e-mail est ouvert sur un autre appareil.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { emailLayout, type EmailContent } from "../src/lib/email-layout";

const link = (type: string) => `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=${type}`;
const IGNORE = "Vous n'êtes pas à l'origine de cette demande ? Ignorez simplement ce message : rien ne sera modifié sur votre compte.";

const templates: { file: string; supabaseName: string; subject: string; content: EmailContent }[] = [
  {
    file: "magic-link.html",
    supabaseName: "Magic Link",
    subject: "Confirmez votre adresse et connectez-vous à VerdOlive",
    content: {
      preheader: "Un clic pour confirmer votre adresse et accéder à votre espace.",
      title: "Confirmez votre adresse e-mail",
      arabic: "أكّد بريدك الإلكتروني: اضغط على الزر لتأكيد عنوانك والدخول إلى حسابك. الرابط صالح لمدة ساعة ويُستعمل مرة واحدة.",
      paragraphs: [
        "Bonjour,",
        "Cliquez sur le bouton ci-dessous pour confirmer votre adresse et vous connecter à votre espace VerdOlive.",
      ],
      button: { label: "Confirmer et me connecter", url: link("magiclink") },
      note: `Ce lien est valable une heure et ne sert qu'une fois. Si vous en avez demandé plusieurs, seul le plus récent fonctionne. ${IGNORE}`,
      siteUrl: "{{ .SiteURL }}",
    },
  },
  {
    file: "reset-password.html",
    supabaseName: "Reset Password",
    subject: "Réinitialisez votre mot de passe VerdOlive",
    content: {
      preheader: "Choisissez un nouveau mot de passe pour votre compte VerdOlive.",
      title: "Choisissez un nouveau mot de passe",
      arabic: "طلبت إعادة تعيين كلمة المرور: اضغط على الزر لاختيار كلمة جديدة. الرابط صالح لمدة ساعة.",
      paragraphs: ["Bonjour,", "Vous avez demandé à réinitialiser le mot de passe de votre compte VerdOlive."],
      button: { label: "Choisir un nouveau mot de passe", url: link("recovery") },
      note: `Ce lien est valable une heure et ne sert qu'une fois. ${IGNORE}`,
      siteUrl: "{{ .SiteURL }}",
    },
  },
  {
    file: "confirm-signup.html",
    supabaseName: "Confirm signup",
    subject: "Bienvenue sur VerdOlive : confirmez votre adresse",
    content: {
      preheader: "Dernière étape pour activer votre compte VerdOlive.",
      title: "Bienvenue sur VerdOlive",
      arabic: "مرحبًا بك في VerdOlive: أكّد بريدك الإلكتروني بالضغط على الزر.",
      paragraphs: [
        "Bonjour,",
        "Merci pour votre inscription. Confirmez votre adresse e-mail pour contacter un propriétaire ou soumettre votre terrain.",
      ],
      button: { label: "Confirmer mon adresse", url: link("email") },
      note: `Ce lien est valable une heure. ${IGNORE}`,
      siteUrl: "{{ .SiteURL }}",
    },
  },
];

const dir = new URL("../supabase/email-templates/", import.meta.url);
mkdirSync(dir, { recursive: true });
for (const t of templates) {
  writeFileSync(new URL(t.file, dir), emailLayout(t.content));
  console.log(`${t.supabaseName.padEnd(16)} ${t.file.padEnd(22)} Sujet : ${t.subject}`);
}
