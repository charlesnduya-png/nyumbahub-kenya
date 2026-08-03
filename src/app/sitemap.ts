import type { MetadataRoute } from "next";
import { mockBlogPosts, mockProperties } from "@/data/mock";
import { APP_URL } from "@/lib/seo";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${APP_URL}/properties`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${APP_URL}/agents`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${APP_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${APP_URL}/compare`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${APP_URL}/login`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${APP_URL}/register`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  let propertyRoutes: MetadataRoute.Sitemap = [];
  let blogRoutes: MetadataRoute.Sitemap = [];

  try {
    const properties = await prisma.property.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
      take: 500,
    });

    propertyRoutes = properties.map((p) => ({
      url: `${APP_URL}/properties/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  } catch {
    propertyRoutes = mockProperties.map((p) => ({
      url: `${APP_URL}/properties/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
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
      priority: 0.6,
    }));
  } catch {
    blogRoutes = mockBlogPosts.map((p) => ({
      url: `${APP_URL}/blog/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  }

  return [...staticRoutes, ...propertyRoutes, ...blogRoutes];
}
