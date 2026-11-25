"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/guard";
import { getSession } from "@/lib/auth/session";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const text = (f: FormData, k: string, max = 2000) => String(f.get(k) ?? "").trim().slice(0, max);
const num = (f: FormData, k: string) => Math.max(0, Number(f.get(k)) || 0);

async function user(next: string) {
  const s = await getSession();
  if (!s) redirect(`/connexion?next=${encodeURIComponent(next)}`);
  return { s, db: await createClient() };
}

/** Premier message au propriétaire d'un terrain, ou réponse dans une conversation. */
export async function sendMessage(f: FormData) {
  const land = text(f, "land", 40);
  const { s, db } = await user("/compte/messages");
  const body = text(f, "body");
  if (!body) redirect("/compte/messages");
  let to = text(f, "to", 40);
  if (!to) {
    // L'identifiant du propriétaire n'est jamais exposé au navigateur.
    const { data } = await createServiceClient().from("lands").select("owner_id").eq("id", land).maybeSingle();
    to = data?.owner_id ?? "";
    if (f.get("charter") === "on") await db.from("profiles").update({ charter_accepted_at: new Date().toISOString() }).eq("id", s.userId);
  }
  const { error } = await db.from("messages").insert({ land_id: land, sender_id: s.userId, recipient_id: to, body });
  redirect(error ? "/compte/messages?erreur=1" : "/compte/messages?envoye=1");
}

export async function requestQuote(f: FormData) {
  const { s, db } = await user("/prestataires");
  const message = text(f, "message");
  if (message) await db.from("quote_requests").insert({ provider_id: text(f, "provider", 40), user_id: s.userId, message });
  redirect("/prestataires?envoye=1");
}

export async function addProvider(f: FormData) {
  await requireAdminPage();
  const db = await createClient();
  await db.from("providers").insert({ name: text(f, "name", 120), service: text(f, "service", 80), governorate_id: text(f, "gouv", 40) || null, phone: text(f, "phone", 40) || null, email: text(f, "email", 120) || null });
  revalidatePath("/admin/prestataires");
}

export async function toggleProvider(f: FormData) {
  await requireAdminPage();
  await (await createClient()).from("providers").update({ active: f.get("active") === "1" }).eq("id", text(f, "id", 40));
  revalidatePath("/admin/prestataires");
}

export async function setQuoteStatus(f: FormData) {
  await requireAdminPage();
  await (await createClient()).from("quote_requests").update({ status: text(f, "status", 10) }).eq("id", text(f, "id", 40));
  revalidatePath("/admin/prestataires");
}

export async function saveDeal(f: FormData) {
  await requireAdminPage();
  const db = await createClient();
  const id = text(f, "id", 40);
  if (id) await db.from("deals").update({ stage: text(f, "stage", 20) }).eq("id", id);
  else
    await db.from("deals").insert({
      land_id: text(f, "land", 40) || null, investor_name: text(f, "investor", 120), stage: text(f, "stage", 20),
      amount_tnd: num(f, "amount"), commission_tnd: num(f, "commission"), hectares: num(f, "hectares"),
      trees_planted: Math.round(num(f, "trees")), jobs: Math.round(num(f, "jobs")), women: Math.round(num(f, "women")), youth: Math.round(num(f, "youth")), note: text(f, "note") || null,
    });
  revalidatePath("/admin/transactions");
}
