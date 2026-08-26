import type { MetadataRoute } from "next";
import { CANONICAL_SITE_URL } from "@/lib/site-domains";

export default function robots(): MetadataRoute.Robots {
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
      `${CANONICAL_SITE_URL}/sitemap.xml`,
      `${CANONICAL_SITE_URL}/sitemap-africa.xml`,
      `${CANONICAL_SITE_URL}/sitemap-pages.xml`,
      `${CANONICAL_SITE_URL}/sitemap-listings.xml`,
    ],
    host: CANONICAL_SITE_URL,
  };
}
