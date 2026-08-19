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
    ],
  },
};

export default nextConfig;
