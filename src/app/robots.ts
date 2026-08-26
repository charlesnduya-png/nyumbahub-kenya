import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { originForHost } from "@/lib/site-domains";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = originForHost((await headers()).get("host"));

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/api/",
          "/account/",
          "/verify-email",
          "/reset-password",
          "/forgot-password",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: [
      `${origin}/sitemap.xml`,
      `${origin}/sitemap-africa.xml`,
      `${origin}/sitemap-pages.xml`,
      `${origin}/sitemap-listings.xml`,
    ],
    host: origin,
  };
}
