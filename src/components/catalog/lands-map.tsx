"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";

export interface MapPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "priority" | "needs_check" | "low" | "incomplete";
  price: string;
  place: string;
  area: string;
}

const COLORS = { priority: "#b08a3a", needs_check: "#5b7a3a", low: "#858c7d", incomplete: "#858c7d" } as const;

/** Fond de carte : MapTiler si une clé est fournie, sinon OpenFreeMap (gratuit, sans clé). */
function styleUrl() {
  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  return key ? `https://api.maptiler.com/maps/landscape/style.json?key=${key}` : "https://tiles.openfreemap.org/styles/liberty";
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Carte interactive de la Tunisie (§8) : positions approximatives, mêmes filtres que le catalogue. */
export function LandsMap({ points }: { points: MapPoint[] }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!container.current) return;
    const m = new maplibregl.Map({
      container: container.current,
      style: styleUrl(),
      center: [9.6, 34.2],
      zoom: 5.4,
      maxBounds: [
        [5.5, 29.5],
        [13.5, 38.2],
      ],
      attributionControl: { compact: true },
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.current = m;
    return () => m.remove();
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const markers = points.map((p) => {
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", p.name);
      el.style.cssText = `width:22px;height:22px;border-radius:9999px;border:3px solid #fbf8f1;background:${COLORS[p.status]};box-shadow:0 2px 6px rgba(20,35,19,.35);cursor:pointer`;
      const popup = new maplibregl.Popup({ offset: 14, maxWidth: "260px" }).setHTML(
        `<div style="font-family:var(--font-inter),system-ui;padding:2px 2px 0">
           <p style="font-weight:600;color:#1e241a;margin:0">${esc(p.name)}</p>
           <p style="color:#4e5747;font-size:13px;margin:4px 0 0">${esc(p.place)} · ${esc(p.area)}</p>
           <p style="color:#1c3020;font-weight:600;margin:6px 0 0">${esc(p.price)}</p>
           <a href="/terrains/${encodeURIComponent(p.id)}" style="display:inline-block;margin-top:8px;color:#24402a;font-weight:600;text-decoration:underline">Voir la fiche →</a>
         </div>`,
      );
      return new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).setPopup(popup).addTo(m);
    });
    if (points.length > 1) {
      const b = new maplibregl.LngLatBounds();
      points.forEach((p) => b.extend([p.lng, p.lat]));
      m.fitBounds(b, { padding: 60, maxZoom: 9, duration: 0 });
    } else if (points.length === 1) m.jumpTo({ center: [points[0].lng, points[0].lat], zoom: 8 });
    return () => markers.forEach((mk) => mk.remove());
  }, [points]);

  return <div ref={container} className="h-full w-full" role="region" aria-label="Carte des terrains" />;
}
