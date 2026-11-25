import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { sendMessage } from "@/lib/extras/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/messages");
  const db = await createClient();
  const { data } = await db.from("messages").select("*").or(`sender_id.eq.${session.userId},recipient_id.eq.${session.userId}`).order("created_at").limit(500);
  const msgs = data ?? [];
  const other = (m: (typeof msgs)[number]) => (m.sender_id === session.userId ? m.recipient_id : m.sender_id);
  const threads = new Map<string, typeof msgs>();
  for (const m of msgs) {
    const k = `${m.land_id}|${other(m)}`;
    threads.set(k, [...(threads.get(k) ?? []), m]);
  }
  const [{ data: people }, { data: lands }] = await Promise.all([
    db.from("profiles").select("id, full_name").in("id", msgs.map(other)),
    db.from("lands").select("id, title").in("id", msgs.map((m) => m.land_id)),
  ]);
  const { data: pub } = await db.from("catalog_lands").select("id, title").in("id", msgs.map((m) => m.land_id));
  const names = new Map((people ?? []).map((p) => [p.id, p.full_name]));
  const titles = new Map([...(pub ?? []), ...(lands ?? [])].map((l) => [l.id, l.title]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold text-forest-900">Messages</h1>
      {(await searchParams).erreur && <p className="mt-4 rounded-xl bg-danger-600/10 p-3 text-sm text-danger-600">Envoi impossible : confirmez votre adresse e-mail et acceptez la charte.</p>}
      {threads.size === 0 && <p className="mt-6 text-ink-600">Aucun message. Écrivez à un propriétaire depuis la fiche d&apos;un terrain.</p>}
      {[...threads].map(([k, list]) => {
        const [land, who] = k.split("|");
        return (
          <section key={k} className="mt-6 rounded-card bg-white p-5 ring-1 ring-forest-900/10">
            <h2 className="font-semibold">{names.get(who) ?? "Correspondant"} · {titles.get(land) ?? "Terrain"}</h2>
            <ul className="mt-3 space-y-2">
              {list.map((m) => (
                <li key={m.id} className={m.sender_id === session.userId ? "ms-8 rounded-xl bg-olive-100 p-3 text-sm" : "me-8 rounded-xl bg-cream-100 p-3 text-sm"}>
                  <p className="whitespace-pre-line">{m.body}</p>
                  <p className="mt-1 text-xs text-ink-400">{new Date(m.created_at).toLocaleString("fr-FR")}</p>
                </li>
              ))}
            </ul>
            <form action={sendMessage} className="mt-3 flex gap-2">
              <input type="hidden" name="land" value={land} />
              <input type="hidden" name="to" value={who} />
              <input name="body" required maxLength={2000} placeholder="Votre réponse" className="flex-1 rounded-xl border border-forest-900/15 px-3 py-2" />
              <button className="rounded-full bg-forest-900 px-5 text-sm font-medium text-cream-50">Envoyer</button>
            </form>
          </section>
        );
      })}
    </div>
  );
}
