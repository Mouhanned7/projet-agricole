import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { emailLayout } from "./email-layout";

/**
 * Envoi d'e-mails transactionnels (notifications, §8) par SMTP.
 * Variables : SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM.
 * Les mêmes identifiants SMTP se saisissent dans Supabase pour les e-mails
 * de confirmation et de connexion (docs/SMTP.md).
 * Sans SMTP configuré, l'e-mail est seulement journalisé : la notification
 * reste visible dans l'application.
 */
let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  if (!transporter) {
    const port = Number(SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465, // 465 : TLS direct ; 587 : STARTTLS
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

export async function sendEmail(msg: { to: string; subject: string; text: string; link?: string }): Promise<boolean> {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const url = msg.link ? `${site}${msg.link}` : site || undefined;
  const t = getTransporter();
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  if (!t || !from) {
    console.info(`[e-mail non envoyé : SMTP non configuré] « ${msg.subject} »`);
    return false;
  }
  try {
    await t.sendMail({
      from,
      to: msg.to,
      subject: msg.subject,
      text: url ? `${msg.text}\n\n${url}` : msg.text,
      html: emailLayout({
        preheader: msg.text.split("\n").find((l) => l.trim() && !l.startsWith("Bonjour")) ?? msg.subject,
        title: msg.subject,
        paragraphs: msg.text.split("\n\n"),
        button: url ? { label: "Ouvrir VerdOlive", url } : undefined,
        siteUrl: site || undefined,
        arabic: "لديك إشعار جديد من VerdOlive. اضغط على الزر للاطلاع عليه.",
      }),
    });
    return true;
  } catch (e) {
    console.error("sendEmail", e instanceof Error ? e.message : e);
    return false;
  }
}
