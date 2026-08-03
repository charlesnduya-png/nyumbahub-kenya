import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/api/", "/account/"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
