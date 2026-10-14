import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }],
    ...(baseUrl ? { host: baseUrl, sitemap: new URL("/sitemap.xml", baseUrl).toString() } : {})
  };
}