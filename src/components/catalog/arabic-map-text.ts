import maplibregl from "maplibre-gl";

/**
 * Sans cette extension, les noms arabes des cartes s'affichent à l'envers, lettres
 * détachées. Fichier hébergé sur le site (public/vendor). À appeler avant de créer une carte.
 */
export function enableArabicText() {
  if (maplibregl.getRTLTextPluginStatus() !== "unavailable") return;
  maplibregl
    .setRTLTextPlugin(`${window.location.origin}/vendor/mapbox-gl-rtl-text.js`, true)
    .catch((e) => console.error("Extension texte arabe", e));
}
