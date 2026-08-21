import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/seo";

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
      `${APP_URL}/sitemap.xml`,
      `${APP_URL}/sitemap-africa.xml`,
      `${APP_URL}/sitemap-pages.xml`,
      `${APP_URL}/sitemap-listings.xml`,
    ],
    host: APP_URL,
  };
}
