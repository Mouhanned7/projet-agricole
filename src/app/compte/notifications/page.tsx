import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/notifications");
  const supabase = await createClient();
  const { data } = await supabase.from("notifications").select("*").eq("user_id", session.userId).order("created_at", { ascending: false }).limit(100);
  // Ouvrir la page marque les notifications comme lues.
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", session.userId).is("read_at", null);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Notifications</h1>
      {!data?.length ? (
        <p className="mt-4 text-ink-600">Aucune notification.</p>
      ) : (
        <ul className="mt-8 divide-y divide-forest-900/10 rounded-card bg-white ring-1 ring-forest-900/10">
          {data.map((n) => (
            <li key={n.id} className={cn("p-4", !n.read_at && "bg-gold-100/40")}>
              <Link href={n.link ?? "#"} className="font-medium text-ink-900 hover:underline">{n.title}</Link>
              {n.body && <p className="mt-1 text-sm text-ink-600">{n.body}</p>}
              <p className="mt-1 text-xs text-ink-400">{new Date(n.created_at).toLocaleString("fr-FR")}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
