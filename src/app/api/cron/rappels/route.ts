import { NextResponse, type NextRequest } from "next/server";
import { sendEmail } from "@/lib/email";
import { createServiceClient } from "@/lib/supabase/server";

/** D10 : rappel au porteur après 14 jours sans modification, alerte admin après 30. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new NextResponse("Non autorisé", { status: 401 });
  const db = createServiceClient();
  const days = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
  const { data } = await db.from("lands").select("id, ref, title, owner_id, updated_at").eq("status", "draft").lt("updated_at", days(14)).limit(200);
  let reminders = 0;
  let alerts = 0;
  for (const l of data ?? []) {
    const link = `/espace-porteur/terrains/${l.id}`;
    const { count } = await db.from("notifications").select("id", { count: "exact", head: true }).eq("kind", "draft_reminder").eq("link", link);
    if (!count) {
      await db.from("notifications").insert({ user_id: l.owner_id, kind: "draft_reminder", title: `Terminez votre dossier : ${l.title ?? l.ref}`, body: "Votre brouillon n'a pas été modifié depuis 14 jours.", link });
      const { data: u } = await db.auth.admin.getUserById(l.owner_id);
      if (u.user?.email) await sendEmail({ to: u.user.email, subject: "Votre dossier VerdOlive vous attend", text: "Bonjour,\n\nVotre brouillon de terrain n'a pas été modifié depuis 14 jours. Vous pouvez le reprendre où vous l'avez laissé.", link });
      reminders++;
    }
    if (l.updated_at < days(30)) {
      const existing = await db.from("admin_alerts").select("id", { count: "exact", head: true }).eq("kind", "stale_draft").eq("land_id", l.id);
      if (!existing.count) {
        await db.from("admin_alerts").insert({ kind: "stale_draft", land_id: l.id });
        alerts++;
      }
    }
  }
  return NextResponse.json({ reminders, alerts });
}
