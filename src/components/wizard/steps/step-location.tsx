"use client";

import { Crosshair, Loader2 } from "lucide-react";
import { useState } from "react";
import { PointMap } from "@/components/catalog/point-map";
import { GOVERNORATES, delegationId } from "@/lib/data/tunisia";
import { NumberInput, Select } from "../controls";
import type { StepProps } from "../types";

/** Étape 3 : localisation et superficie. La carte interactive arrive au Sprint 4. */
export function StepLocation({ draft, patch, showErrors }: StepProps) {
  const loc = draft.location;
  const gov = GOVERNORATES.find((g) => g.id === loc.governorateId);
  const [geo, setGeo] = useState<"idle" | "busy" | "error" | "outside">("idle");

  function useMyPosition() {
    if (!navigator.geolocation) return setGeo("error");
    setGeo("busy");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lat = Math.round(coords.latitude * 1e5) / 1e5;
        const lng = Math.round(coords.longitude * 1e5) / 1e5;
        if (lat < 30 || lat > 38 || lng < 7 || lng > 12) return setGeo("outside");
        patch("location", { lat, lng });
        setGeo("idle");
      },
      () => setGeo("error"),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Gouvernorat"
          required
          value={loc.governorateId}
          onChange={(v) => patch("location", { governorateId: v, delegationId: null })}
          options={GOVERNORATES.map((g) => ({ value: g.id, label: g.fr }))}
          error={showErrors && !loc.governorateId ? "Choisissez le gouvernorat." : null}
        />
        <Select
          label="Délégation"
          required
          value={loc.delegationId}
          onChange={(v) => patch("location", { delegationId: v })}
          disabled={!gov}
          placeholder={gov ? "Choisir…" : "Choisissez d'abord le gouvernorat"}
          options={(gov?.delegations ?? []).map((d) => ({ value: delegationId(gov!.id, d), label: d }))}
          error={showErrors && gov && !loc.delegationId ? "Choisissez la délégation." : null}
        />
      </div>

      <div className="rounded-xl bg-cream-100/70 p-4 sm:p-5">
        <p className="text-sm font-semibold text-ink-900">
          Position du terrain <span className="font-normal text-ink-400">(recommandé)</span>
        </p>
        <p className="mt-1 text-sm text-ink-600">
          Sur place ? Utilisez votre position. La position exacte n&apos;est jamais publiée : les investisseurs voient une zone approximative.
        </p>
        <button
          type="button"
          onClick={useMyPosition}
          disabled={geo === "busy"}
          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-forest-800 px-5 text-sm font-medium text-cream-50 hover:bg-forest-700 disabled:opacity-60"
        >
          {geo === "busy" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Crosshair className="size-4" aria-hidden />}
          Utiliser ma position
        </button>
        {geo === "error" && <p className="mt-2 text-sm text-danger-600">Position indisponible. Autorisez la localisation ou saisissez les coordonnées.</p>}
        {geo === "outside" && <p className="mt-2 text-sm text-danger-600">Votre position semble hors de Tunisie. Saisissez les coordonnées du terrain.</p>}
        <p className="mb-2 mt-4 text-sm text-ink-600">Ou touchez la carte à l&apos;emplacement du terrain.</p>
        <PointMap lat={loc.lat} lng={loc.lng} onPick={(lat, lng) => patch("location", { lat, lng })} />
        <div className="mt-4 grid grid-cols-2 gap-3" key={`${loc.lat}-${loc.lng}`}>
          <NumberInput label="Latitude" value={loc.lat} onChange={(v) => patch("location", { lat: v })} hint="Ex. 36.58" />
          <NumberInput label="Longitude" value={loc.lng} onChange={(v) => patch("location", { lng: v })} hint="Ex. 10.86" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <NumberInput
          label="Superficie totale"
          unit="ha"
          required
          value={loc.areaHa}
          onChange={(v) => patch("location", { areaHa: v })}
          error={showErrors && !loc.areaHa ? "Indiquez la superficie." : null}
          hint="1 hectare = 10 000 m²."
        />
        <NumberInput
          label="Superficie exploitable estimée"
          unit="ha"
          value={loc.exploitableAreaHa}
          onChange={(v) => patch("location", { exploitableAreaHa: v })}
          error={loc.exploitableAreaHa != null && loc.areaHa != null && loc.exploitableAreaHa > loc.areaHa ? "Elle ne peut pas dépasser la superficie totale." : null}
        />
      </div>
    </div>
  );
}
