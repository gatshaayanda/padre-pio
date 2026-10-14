import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();

export default function robots(): MetadataRoute.Robots {
  const rules = { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] };
  if (!baseUrl) return { rules };
  return { rules, sitemap: baseUrl.replace(/\/$/, "") + "/sitemap.xml", host: baseUrl };
}
