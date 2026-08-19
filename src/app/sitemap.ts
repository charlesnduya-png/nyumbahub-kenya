import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/seo";
import { ALL_SEO_LANDINGS } from "@/lib/seo-locations";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${APP_URL}/properties`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.95,
    },
    {
      url: `${APP_URL}/rent`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${APP_URL}/bnb`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${APP_URL}/agents`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${APP_URL}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${APP_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${APP_URL}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${APP_URL}/compare`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${APP_URL}/register`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${APP_URL}/register/professional`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.45,
    },
    {
      url: `${APP_URL}/login`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${APP_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${APP_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${APP_URL}/cookies`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const seoLandingRoutes: MetadataRoute.Sitemap = ALL_SEO_LANDINGS.map(
    (landing) => ({
      url: `${APP_URL}${landing.path}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: landing.priority ?? 0.75,
    }),
  );

  let propertyRoutes: MetadataRoute.Sitemap = [];
  let blogRoutes: MetadataRoute.Sitemap = [];
  let agentRoutes: MetadataRoute.Sitemap = [];

  try {
    const properties = await prisma.property.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true, isFeatured: true },
      orderBy: { updatedAt: "desc" },
      take: 2000,
    });

    propertyRoutes = properties.map((p) => ({
      url: `${APP_URL}/properties/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "daily" as const,
      priority: p.isFeatured ? 0.9 : 0.8,
    }));
  } catch {
    // no property routes when database is unavailable
  }

  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    });

    blogRoutes = posts.map((p) => ({
      url: `${APP_URL}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    }));
  } catch {
    // no blog routes when database is unavailable
  }

  try {
    const agents = await prisma.agent.findMany({
      where: {
        OR: [{ isVerified: true }, { isFeatured: true }],
      },
      select: { id: true, updatedAt: true },
      take: 500,
    });

    agentRoutes = agents.map((a) => ({
      url: `${APP_URL}/agents/${a.id}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // no agent routes when database is unavailable
  }

  return [
    ...staticRoutes,
    ...seoLandingRoutes,
    ...propertyRoutes,
    ...blogRoutes,
    ...agentRoutes,
  ];
}
