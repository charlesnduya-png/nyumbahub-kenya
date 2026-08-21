import { APP_URL } from "@/lib/seo";
import { ALL_SEO_LANDINGS } from "@/lib/seo-locations";
import { getAllPropertyForSalePlaces } from "@/lib/property-for-sale";
import { prisma } from "@/lib/prisma";

export type SitemapEntry = {
  url: string;
  lastModified: Date;
  changeFrequency:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority: number;
};

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

function uniqueEntries(entries: SitemapEntry[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}

export function getPagesSitemapEntries(now = new Date()): SitemapEntry[] {
  return [
    { url: loc("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: loc("/africa"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.97,
    },
    {
      url: loc("/property-for-sale"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.96,
    },
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
}

/** All African countries and cities: sale, rent, and BnB landing pages. */
export function getAfricaSitemapEntries(now = new Date()): SitemapEntry[] {
  const hubs: SitemapEntry[] = [
    {
      url: loc("/africa"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: loc("/property-for-sale"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.96,
    },
    {
      url: loc("/rent"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.94,
    },
    {
      url: loc("/bnb"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.92,
    },
  ];

  const placeRoutes: SitemapEntry[] = getAllPropertyForSalePlaces().flatMap(
    (place) => {
      const isCountryOrCounty =
        place.kind === "county" || place.kind === "country";
      return [
        {
          url: loc(`/property-for-sale/${place.slug}`),
          lastModified: now,
          changeFrequency: "daily" as const,
          priority: isCountryOrCounty ? 0.9 : 0.82,
        },
        {
          url: loc(`/rent/${place.slug}`),
          lastModified: now,
          changeFrequency: "daily" as const,
          priority: isCountryOrCounty ? 0.86 : 0.8,
        },
        {
          url: loc(`/bnb/${place.slug}`),
          lastModified: now,
          changeFrequency: "daily" as const,
          priority: isCountryOrCounty ? 0.84 : 0.78,
        },
      ];
    },
  );

  const extraLandings: SitemapEntry[] = ALL_SEO_LANDINGS.map((landing) => ({
    url: loc(landing.path),
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: landing.priority ?? 0.75,
  }));

  return uniqueEntries([...hubs, ...placeRoutes, ...extraLandings]);
}

export async function getListingsSitemapEntries(
  now = new Date(),
): Promise<SitemapEntry[]> {
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

    const propertyRoutes: SitemapEntry[] = properties
      .filter((property) => /^[a-z0-9-]+$/i.test(property.slug))
      .map((property) => ({
        url: loc(`/properties/${property.slug}`),
        lastModified: property.updatedAt,
        changeFrequency: "daily",
        priority: property.isFeatured ? 0.9 : 0.8,
      }));

    const blogRoutes: SitemapEntry[] = posts
      .filter((post) => /^[a-z0-9-]+$/i.test(post.slug))
      .map((post) => ({
        url: loc(`/blog/${post.slug}`),
        lastModified: post.updatedAt,
        changeFrequency: "weekly",
        priority: 0.65,
      }));

    const agentRoutes: SitemapEntry[] = agents.map((agent) => ({
      url: loc(`/agents/${agent.id}`),
      lastModified: agent.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return uniqueEntries([...propertyRoutes, ...blogRoutes, ...agentRoutes]);
  } catch (error) {
    console.error("listings sitemap generation failed", error);
    return [];
  }
}

export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const now = new Date();
  const listings = await getListingsSitemapEntries(now);
  return uniqueEntries([
    ...getPagesSitemapEntries(now),
    ...getAfricaSitemapEntries(now),
    ...listings,
  ]);
}

export const SITEMAP_INDEX_PATHS = [
  "/sitemap-africa.xml",
  "/sitemap-pages.xml",
  "/sitemap-listings.xml",
] as const;

export function renderSitemapIndexXml(now = new Date()) {
  const body = SITEMAP_INDEX_PATHS.map(
    (path) => `  <sitemap>
    <loc>${escapeXml(loc(path))}</loc>
    <lastmod>${now.toISOString()}</lastmod>
  </sitemap>`,
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap-index.xsl"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>
`;
}

export function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function renderSitemapXml(entries: SitemapEntry[]) {
  const body = entries
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    <lastmod>${entry.lastModified.toISOString()}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

export const SITEMAP_XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
};
