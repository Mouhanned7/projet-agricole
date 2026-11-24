import type { MetadataRoute } from "next";
import { getCatalogItems } from "@/lib/catalog/source";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { items, demo } = await getCatalogItems();
  return [
    { url: `${site}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/catalogue`, changeFrequency: "daily", priority: 0.9 },
    { url: `${site}/carte`, changeFrequency: "daily", priority: 0.6 },
    ...(demo ? [] : items.map((l) => ({ url: `${site}/terrains/${l.id}`, lastModified: l.publishedAt ?? undefined, priority: 0.7 }))),
  ];
}
