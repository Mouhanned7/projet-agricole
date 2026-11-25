"use client";

import { Camera, FileUp, Loader2, Lock, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { compressImage } from "@/lib/compress-image";
import { refreshRanking } from "@/lib/lands/actions";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ErrorText } from "../controls";
import type { StepProps } from "../types";

const MAX_BYTES = 10 * 1024 * 1024; // décision D9
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const DOC_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/heic"];

type DocKind = "title" | "alt_ownership" | "joint_agreement" | "water_permit" | "water_analysis" | "soil_analysis" | "other";

interface Photo { id: string; storage_path: string; url?: string }
interface Doc { id: string; kind: DocKind; storage_path: string; status: string; created_at: string }

const DOC_STATUS: Record<string, string> = { received: "Reçu", to_review: "À vérifier", accepted: "Accepté", refused: "Refusé" };

function safeName(name: string) {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.\-]+/g, "_").slice(-80);
}

/** Étape 5 : photos (publiques après publication) et pièces (toujours privées, §4). */
export function StepMedia({ draft, landId, mode, media, setMedia, ensureSaved }: StepProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const live = mode === "live";

  const docSlots: { kind: DocKind; label: string; help: string }[] = [
    draft.title.answer === "yes"
      ? { kind: "title", label: "Titre foncier", help: "Photo ou PDF. Nécessaire pour obtenir le badge « Titre vérifié »." }
      : { kind: "alt_ownership", label: "Document de propriété", help: "Acte adoulaire, contrat, certificat…" },
    ...(draft.title.ownership === "joint"
      ? [{ kind: "joint_agreement" as const, label: "Accord des indivisaires", help: "Facultatif, renforce votre dossier." }]
      : []),
    ...(draft.water.answer === "yes"
      ? [
          { kind: "water_analysis" as const, label: "Analyse de l'eau", help: "Salinité, qualité. Permet le badge « Eau analysée »." },
          { kind: "water_permit" as const, label: "Autorisation du puits / forage", help: "Si applicable." },
        ]
      : []),
    { kind: "soil_analysis", label: "Analyse du sol", help: "Si vous en avez une." },
    { kind: "other", label: "Autre document", help: "Plan, attestation…" },
  ];

  const load = useCallback(async () => {
    if (!live || !landId) return;
    const supabase = createClient();
    const [{ data: p }, { data: d }] = await Promise.all([
      supabase.from("land_photos").select("id, storage_path").eq("land_id", landId).order("position"),
      supabase.from("land_documents").select("id, kind, storage_path, status, created_at").eq("land_id", landId).order("created_at"),
    ]);
    const withUrls = await Promise.all(
      (p ?? []).map(async (ph) => {
        const { data } = await supabase.storage.from("land-photos").createSignedUrl(ph.storage_path, 3600);
        return { ...ph, url: data?.signedUrl };
      }),
    );
    setPhotos(withUrls);
    setDocs((d ?? []) as Doc[]);
  }, [live, landId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function afterChange(id: string) {
    const r = await refreshRanking(id);
    if (r.media) setMedia(r.media);
    await load();
  }

  async function upload(files: FileList | null, target: "photo" | DocKind) {
    setError(null);
    if (!files?.length) return;
    const allowed = target === "photo" ? PHOTO_TYPES : DOC_TYPES;
    const picked = Array.from(files).slice(0, target === "photo" ? 12 : 1);
    const list = target === "photo" ? await Promise.all(picked.map((f) => compressImage(f))) : picked;
    for (const f of list) {
      if (f.size > MAX_BYTES) return setError(`« ${f.name} » dépasse 10 Mo.`);
      if (f.type && !allowed.includes(f.type)) return setError(`« ${f.name} » : format non accepté.`);
    }
    if (!live) {
      // Prévisualisation : on simule seulement les compteurs.
      if (target === "photo") setMedia({ ...media, photoCount: media.photoCount + list.length });
      else
        setMedia({
          ...media,
          documentsCount: media.documentsCount + 1,
          hasTitleUpload: media.hasTitleUpload || target === "title" || target === "alt_ownership",
          hasWaterAnalysis: media.hasWaterAnalysis || target === "water_analysis",
        });
      return;
    }

    const id = landId ?? (await ensureSaved());
    if (!id) return setError("Enregistrez d'abord votre brouillon.");
    setBusy(target);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    try {
      for (const [i, f] of list.entries()) {
        const path = `${id}/${crypto.randomUUID()}-${safeName(f.name)}`;
        const bucket = target === "photo" ? "land-photos" : "land-documents";
        const { error: upErr } = await supabase.storage.from(bucket).upload(path, f, { contentType: f.type || undefined });
        if (upErr) throw upErr;
        const { error: rowErr } =
          target === "photo"
            ? await supabase.from("land_photos").insert({ land_id: id, storage_path: path, position: photos.length + i })
            : await supabase.from("land_documents").insert({ land_id: id, kind: target, storage_path: path, uploaded_by: auth.user?.id });
        if (rowErr) throw rowErr;
      }
      await afterChange(id);
    } catch {
      setError("Le téléversement a échoué. Vérifiez votre connexion et réessayez.");
    } finally {
      setBusy(null);
    }
  }

  async function removePhoto(p: Photo) {
    if (!landId) return;
    setBusy(p.id);
    const supabase = createClient();
    await supabase.storage.from("land-photos").remove([p.storage_path]);
    await supabase.from("land_photos").delete().eq("id", p.id);
    await afterChange(landId);
    setBusy(null);
  }

  return (
    <div className="space-y-8">
      {!live && (
        <p className="rounded-xl bg-gold-100 px-4 py-3 text-sm text-forest-900">
          Mode prévisualisation : les fichiers ne sont pas envoyés, seuls les compteurs de la jauge changent.
        </p>
      )}

      <section>
        <h3 className="text-base font-semibold text-ink-900">Photos du terrain</h3>
        <p className="mt-1 text-sm text-ink-600">
          Au moins une photo est nécessaire pour être « Prioritaire ». Vue générale, arbres, puits, accès… JPG, PNG ou HEIC, 10 Mo
          maximum.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((p) => (
            <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl bg-cream-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.url && <img src={p.url} alt="" className="size-full object-cover" />}
              <button
                type="button"
                onClick={() => removePhoto(p)}
                className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-full bg-forest-950/70 text-cream-50 hover:bg-danger-600"
                aria-label="Supprimer la photo"
              >
                {busy === p.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              </button>
            </div>
          ))}
          {!live &&
            Array.from({ length: media.photoCount }, (_, i) => (
              <div key={i} className="grid aspect-square place-items-center rounded-xl bg-olive-100 text-xs text-forest-800">
                Photo {i + 1}
              </div>
            ))}
          <UploadTile
            label="Ajouter des photos"
            icon={<Camera className="size-6" />}
            accept={PHOTO_TYPES.join(",")}
            multiple
            busy={busy === "photo"}
            onFiles={(f) => upload(f, "photo")}
          />
        </div>
      </section>

      <section>
        <h3 className="flex items-center gap-2 text-base font-semibold text-ink-900">
          Documents <Lock className="size-4 text-ink-400" aria-hidden />
        </h3>
        <p className="mt-1 text-sm text-ink-600">
          Privés : seuls vous et l&apos;équipe VerdOlive y avez accès. Photo prise avec le téléphone acceptée.
        </p>
        <ul className="mt-4 divide-y divide-forest-900/10 rounded-xl bg-white ring-1 ring-forest-900/10">
          {docSlots.map((slot) => {
            const existing = docs.filter((d) => d.kind === slot.kind);
            const last = existing.at(-1);
            return (
              <li key={slot.kind} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <p className="font-medium text-ink-900">{slot.label}</p>
                  <p className="text-sm text-ink-400">{slot.help}</p>
                </div>
                {last && (
                  <span
                    className={cn(
                      "self-start rounded-full px-2.5 py-1 text-xs font-medium sm:self-center",
                      last.status === "accepted" ? "bg-olive-100 text-forest-800" : last.status === "refused" ? "bg-danger-600/10 text-danger-600" : "bg-cream-200 text-ink-600",
                    )}
                  >
                    {DOC_STATUS[last.status]} · {new Date(last.created_at).toLocaleDateString("fr-FR")}
                  </span>
                )}
                <FileButton
                  label={last ? "Remplacer" : "Ajouter"}
                  accept={DOC_TYPES.join(",")}
                  busy={busy === slot.kind}
                  onFiles={(f) => upload(f, slot.kind)}
                />
              </li>
            );
          })}
        </ul>
      </section>
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}

function UploadTile({
  label,
  icon,
  accept,
  multiple,
  busy,
  onFiles,
}: {
  label: string;
  icon: React.ReactNode;
  accept: string;
  multiple?: boolean;
  busy: boolean;
  onFiles: (f: FileList | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-forest-900/20 bg-white text-center text-xs font-medium text-forest-800 hover:border-gold-500 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold-500">
      <span className="flex flex-col items-center gap-1.5 px-2">
        {busy ? <Loader2 className="size-6 animate-spin" /> : icon}
        {label}
      </span>
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          onFiles(e.target.files);
          if (ref.current) ref.current.value = "";
        }}
      />
    </label>
  );
}

function FileButton({ label, accept, busy, onFiles }: { label: string; accept: string; busy: boolean; onFiles: (f: FileList | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 self-start rounded-full border border-forest-900/20 bg-white px-4 text-sm font-medium text-forest-900 hover:bg-forest-900/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold-500 sm:self-center">
      {busy ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" aria-hidden />}
      {label}
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          onFiles(e.target.files);
          if (ref.current) ref.current.value = "";
        }}
      />
    </label>
  );
}
