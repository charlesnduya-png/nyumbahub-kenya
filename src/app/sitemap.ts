import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/seo";
import { ALL_SEO_LANDINGS } from "@/lib/seo-locations";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

function loc(path = "/"): string {
  if (!path || path === "/") return `${APP_URL}/`;
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${APP_URL}${suffix}`;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("sitemap query timed out")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: loc("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: loc("/properties"),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.95,
    },
    {
      url: loc("/rent"),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: loc("/bnb"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: loc("/agents"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: loc("/blog"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: loc("/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: loc("/pricing"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: loc("/privacy"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: loc("/terms"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: loc("/cookies"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const seoLandingRoutes: MetadataRoute.Sitemap = ALL_SEO_LANDINGS.map(
    (landing) => ({
      url: loc(landing.path),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: landing.priority ?? 0.75,
    }),
  );

  try {
    const [properties, posts, agents] = await withTimeout(
      Promise.all([
        prisma.property.findMany({
          where: { status: "ACTIVE" },
          select: { slug: true, updatedAt: true, isFeatured: true },
          orderBy: { updatedAt: "desc" },
          take: 1000,
        }),
        prisma.blogPost.findMany({
          where: { published: true },
          select: { slug: true, updatedAt: true },
        }),
        prisma.agent.findMany({
          where: {
            OR: [{ isVerified: true }, { isFeatured: true }],
          },
          select: { id: true, updatedAt: true },
          take: 500,
        }),
      ]),
      8000,
    );

    const propertyRoutes: MetadataRoute.Sitemap = properties
      .filter((property) => /^[a-z0-9-]+$/i.test(property.slug))
      .map((property) => ({
        url: loc(`/properties/${property.slug}`),
        lastModified: property.updatedAt,
        changeFrequency: "daily" as const,
        priority: property.isFeatured ? 0.9 : 0.8,
      }));

    const blogRoutes: MetadataRoute.Sitemap = posts
      .filter((post) => /^[a-z0-9-]+$/i.test(post.slug))
      .map((post) => ({
        url: loc(`/blog/${post.slug}`),
        lastModified: post.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.65,
      }));

    const agentRoutes: MetadataRoute.Sitemap = agents.map((agent) => ({
      url: loc(`/agents/${agent.id}`),
      lastModified: agent.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [
      ...staticRoutes,
      ...seoLandingRoutes,
      ...propertyRoutes,
      ...blogRoutes,
      ...agentRoutes,
    ];
  } catch (error) {
    console.error("sitemap generation failed", error);
    return [...staticRoutes, ...seoLandingRoutes];
  }
}
