import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (!baseUrl) return [];
  return [
    { url: new URL("/", baseUrl).toString(), changeFrequency: "monthly", priority: 1 },
    { url: new URL("/privacy", baseUrl).toString(), changeFrequency: "yearly", priority: 0.3 }
  ];
}