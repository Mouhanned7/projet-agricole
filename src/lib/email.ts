import "server-only";

/**
 * Envoi d'e-mails transactionnels (notifications, §8). Utilise Resend si
 * RESEND_API_KEY et EMAIL_FROM sont définis ; sinon l'e-mail est seulement
 * journalisé (la notification reste visible dans l'application).
 */
export async function sendEmail(msg: { to: string; subject: string; text: string; link?: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const url = msg.link ? `${site}${msg.link}` : site;
  if (!key || !from) {
    console.info(`[email non envoyé : RESEND_API_KEY absent] « ${msg.subject} »`);
    return false;
  }
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const html = `<div style="font-family:system-ui,sans-serif;color:#1e241a;max-width:560px">
    <p style="font-size:20px;font-weight:600;color:#1c3020">VerdOlive</p>
    <p style="white-space:pre-line">${esc(msg.text)}</p>
    ${url ? `<p><a href="${esc(url)}" style="display:inline-block;background:#1c3020;color:#fbf8f1;padding:10px 18px;border-radius:999px;text-decoration:none">Ouvrir VerdOlive</a></p>` : ""}
  </div>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, text: `${msg.text}\n\n${url}`, html }),
    });
    if (!res.ok) console.error("sendEmail", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("sendEmail", e);
    return false;
  }
}
