/**
 * Mise en page commune des e-mails VerdOlive : notifications du site (SMTP) et
 * modèles Supabase (scripts/generate-email-templates.ts). HTML en tableaux et
 * styles en ligne, pour un rendu correct dans Gmail, Outlook et sur téléphone.
 */
export interface EmailContent {
  /** Texte d'aperçu affiché dans la boîte de réception. */
  preheader: string;
  title: string;
  paragraphs: string[];
  button?: { label: string; url: string };
  /** Encadré d'information sous le bouton. */
  note?: string;
  /** Résumé en arabe, affiché de droite à gauche. */
  arabic?: string;
  siteUrl?: string;
}

export const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";

export function emailLayout(c: EmailContent): string {
  const e = escapeHtml;
  const paragraphs = c.paragraphs
    .map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#4e5747;white-space:pre-line">${e(p)}</p>`)
    .join("");
  const button = c.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0">
        <tr><td style="border-radius:999px;background:#24402a">
          <a href="${e(c.button.url)}" style="display:inline-block;padding:14px 24px;font-family:${FONT};font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px">${e(c.button.label)}</a>
        </td></tr>
      </table>`
    : "";
  const note = c.note
    ? `<p style="margin:0 0 20px;padding:14px 16px;background:#f6f1e5;border-radius:12px;font-size:14px;line-height:1.5;color:#4e5747">${e(c.note)}</p>`
    : "";
  const fallback = c.button
    ? `<p style="margin:0;border-top:1px solid #ece4d2;padding-top:18px;font-size:12px;line-height:1.6;color:#858c7d">Le bouton ne fonctionne pas ? Copiez cette adresse dans votre navigateur :<br>
        <a href="${e(c.button.url)}" style="color:#24402a;word-break:break-all">${e(c.button.url)}</a></p>`
    : "";

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${e(c.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f6f1e5;font-family:${FONT}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${e(c.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e5">
  <tr><td align="center" style="padding:24px 10px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
      <tr><td style="padding:0 8px 18px">
        <span style="font-family:${SERIF};font-size:26px;font-weight:bold;color:#24402a">VerdOlive</span><br>
        <span style="font-size:12px;letter-spacing:1px;color:#b08a3a">Investir · Cultiver · Préserver</span>
      </td></tr>
      <tr><td style="background:#ffffff;border-radius:20px;border-top:4px solid #c9a24b;padding:28px 22px">
        <h1 style="margin:0 0 18px;font-family:${SERIF};font-size:26px;line-height:1.3;color:#1c3020">${e(c.title)}</h1>
        ${paragraphs}${button}${note}${c.arabic ? `<p dir="rtl" lang="ar" style="margin:0 0 20px;text-align:right;font-size:15px;line-height:1.8;color:#4e5747">${e(c.arabic)}</p>` : ""}${fallback}
      </td></tr>
      <tr><td style="padding:20px 8px 0;font-size:12px;line-height:1.6;color:#858c7d;text-align:center">
        VerdOlive, la mise en relation entre investisseurs et porteurs de terrain agricole en Tunisie.${
          c.siteUrl ? `<br><a href="${e(c.siteUrl)}" style="color:#24402a">Visiter le site</a>` : ""
        }
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
`;
}
