import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone is for Docker/Railway self-hosting; Vercel uses its own output.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.yourhome.co.ke" }],
        destination: "https://yourhome.co.ke/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=3600",
          },
        ],
      },
      {
        source: "/sitemap-africa.xml",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=3600",
          },
        ],
      },
      {
        source: "/:file(sitemap|sitemap-index).xsl",
        headers: [
          {
            key: "Content-Type",
            value: "text/xsl; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=86400",
          },
        ],
      },
      {
        source: "/robots.txt",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=86400",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
