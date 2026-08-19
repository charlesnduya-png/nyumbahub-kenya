import type { MetadataRoute } from "next";
import { APP_NAME, APP_DESCRIPTION, APP_URL } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} Kenya`,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#071a14",
    theme_color: "#0b6e4f",
    lang: "en-KE",
    categories: ["business", "lifestyle"],
    icons: [
      {
        src: "/opengraph-image",
        sizes: "1200x630",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
