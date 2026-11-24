"use client";

/**
 * Chargeur d'images global (next.config.ts > images.loaderFile).
 * - Unsplash : redimensionnement et format (AVIF/WebP) par le CDN d'Unsplash.
 * - Autres sources (photos Supabase signées) : servies telles quelles.
 */
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (src.startsWith("https://images.unsplash.com/")) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality ?? 75));
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "crop");
    return url.toString();
  }
  return src;
}
