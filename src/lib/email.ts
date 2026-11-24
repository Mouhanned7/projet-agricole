import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

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

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function renderEmail(text: string, url?: string) {
  return `<div style="font-family:system-ui,-apple-system,sans-serif;color:#1e241a;max-width:560px;margin:0 auto;padding:24px">
    <p style="font-size:22px;font-weight:600;color:#24402a;margin:0 0 16px">VerdOlive</p>
    <p style="white-space:pre-line;line-height:1.6;margin:0 0 20px">${esc(text)}</p>
    ${url ? `<p style="margin:0 0 24px"><a href="${esc(url)}" style="display:inline-block;background:#24402a;color:#ffffff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">Ouvrir VerdOlive</a></p>` : ""}
    <p style="font-size:12px;color:#858c7d;margin:0">Vous recevez ce message car vous avez un compte VerdOlive.</p>
  </div>`;
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
      html: renderEmail(msg.text, url),
    });
    return true;
  } catch (e) {
    console.error("sendEmail", e instanceof Error ? e.message : e);
    return false;
  }
}
