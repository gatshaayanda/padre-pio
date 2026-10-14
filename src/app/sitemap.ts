import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();

export default function sitemap(): MetadataRoute.Sitemap {
  if (!baseUrl) return [];
  const root = baseUrl.replace(/\/$/, "");
  return [
    { url: root, changeFrequency: "weekly", priority: 1 },
    { url: root + "/appointments/request", changeFrequency: "monthly", priority: 0.8 }
  ];
}
