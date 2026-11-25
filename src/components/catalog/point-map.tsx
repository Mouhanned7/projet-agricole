"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { enableArabicText } from "./arabic-map-text";

const PLAN = "https://tiles.openfreemap.org/styles/liberty";
const SATELLITE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    sat: {
      type: "raster",
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      attribution: "Images © Esri, Maxar, Earthstar Geographics",
    },
  },
  layers: [{ id: "sat", type: "raster", source: "sat" }],
};

/** Carte d'un point, plan ou satellite. Avec `onPick`, un clic place le terrain. */
export function PointMap({ lat, lng, onPick }: { lat: number | null; lng: number | null; onPick?: (lat: number, lng: number) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const pick = useRef(onPick);
  pick.current = onPick;
  const [satellite, setSatellite] = useState(false);

  useEffect(() => {
    if (!box.current) return;
    enableArabicText();
    const m = new maplibregl.Map({
      container: box.current,
      style: PLAN,
      center: lat != null && lng != null ? [lng, lat] : [9.6, 34.2],
      zoom: lat != null ? 11 : 5.3,
      attributionControl: { compact: true },
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    m.on("click", (e) => pick.current?.(Math.round(e.lngLat.lat * 1e5) / 1e5, Math.round(e.lngLat.lng * 1e5) / 1e5));
    map.current = m;
    return () => m.remove();
    // La carte n'est créée qu'une fois ; le marqueur suit les coordonnées.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    marker.current?.remove();
    if (lat != null && lng != null) marker.current = new maplibregl.Marker({ color: "#24402a" }).setLngLat([lng, lat]).addTo(m);
  }, [lat, lng]);

  return (
    <div className="relative h-72 overflow-hidden rounded-xl ring-1 ring-forest-900/10">
      <div ref={box} className="h-full w-full" />
      <div className="absolute left-2 top-2 flex rounded-full bg-white p-1 text-xs font-medium shadow">
        {[false, true].map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => {
              setSatellite(v);
              map.current?.setStyle(v ? SATELLITE : PLAN);
            }}
            className={cn("rounded-full px-3 py-1", satellite === v && "bg-forest-900 text-cream-50")}
          >
            {v ? "Satellite" : "Plan"}
          </button>
        ))}
      </div>
    </div>
  );
}
