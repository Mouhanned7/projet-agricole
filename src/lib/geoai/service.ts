import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toLs } from "@/lib/catalog/map";
import { getDraft } from "@/lib/lands/queries";
import { createServiceClient } from "@/lib/supabase/server";
import { diagnose, type Diagnostic } from "./diagnose";

export interface StoredDiagnostic {
  data: Diagnostic;
  agriScore: number | null;
  status: "auto" | "validated";
  generatedAt: string;
  validatedAt: string | null;
  validationNotes: string | null;
}

/** Lit le diagnostic avec les droits de l'appelant (RLS : public seulement si validé). */
export async function getDiagnostic(supabase: SupabaseClient, landId: string): Promise<StoredDiagnostic | null> {
  const { data } = await supabase.from("land_diagnostics").select("*").eq("land_id", landId).maybeSingle();
  if (!data) return null;
  return {
    data: data.data as Diagnostic,
    agriScore: data.agri_score,
    status: data.status,
    generatedAt: data.generated_at,
    validatedAt: data.validated_at,
    validationNotes: data.validation_notes,
  };
}

/**
 * Génère (ou régénère) le diagnostic d'un terrain et l'enregistre « automatique ».
 * Écriture avec la clé serveur ; l'appelant a vérifié ses droits sur le terrain.
 */
export async function runDiagnostic(landId: string): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { ok: false, error: "Clé serveur manquante." };
  const loaded = await getDraft(landId);
  if (!loaded) return { ok: false, error: "Terrain introuvable." };
  const { location, water } = loaded.draft;
  if (location.lat == null || location.lng == null) return { ok: false, error: "Coordonnées GPS manquantes : le diagnostic a besoin de la position du terrain." };
  if (!location.areaHa) return { ok: false, error: "Superficie manquante." };

  const d = await diagnose({
    lat: location.lat,
    lng: location.lng,
    areaHa: location.areaHa,
    exploitableAreaHa: location.exploitableAreaHa,
    water: {
      available: water.answer === "yes",
      yearRound: water.availability === "year_round",
      salinityGL: water.salinityGL,
      flowLs: toLs(water.flowValue, water.flowUnit),
      flowNature: water.flowValue != null ? (water.flowMeasured ? "measured" : "declared") : null,
    },
    declaredCrops: loaded.draft.land.crops,
  });
  const { error } = await createServiceClient()
    .from("land_diagnostics")
    .upsert({ land_id: landId, data: d, agri_score: d.agriScore, status: "auto", generated_at: d.generatedAt, validated_by: null, validated_at: null });
  return error ? { ok: false, error: "Enregistrement du diagnostic impossible." } : { ok: true };
}
