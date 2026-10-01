import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const host = new URL(siteUrl).host;
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/backend", "/api/v1/admin"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    // Host should be hostname only (www) — matches canonical, avoids apex/www clash.
    host,
  };
}
