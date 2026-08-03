import Link from "next/link";
import { Suspense } from "react";
import { PropertySearchClient } from "@/components/properties/property-search";
import { filterMockProperties } from "@/data/mock";
import { prisma } from "@/lib/prisma";
import { propertySearchSchema } from "@/lib/validations/property";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function getProperties(searchParams: Record<string, string | string[] | undefined>) {
  const raw: Record<string, string> = {};
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") raw[key] = value;
  }

  const parsed = propertySearchSchema.safeParse(raw);
  const filters = parsed.success ? parsed.data : { page: 1, limit: 12 };

  try {
    const skip = (filters.page - 1) * filters.limit;
    const where = {
      status: "ACTIVE" as const,
      ...(filters.listingType ? { listingType: filters.listingType } : {}),
      ...(filters.county
        ? { county: { contains: filters.county, mode: "insensitive" as const } }
        : {}),
      ...(filters.town
        ? { town: { contains: filters.town, mode: "insensitive" as const } }
        : {}),
      ...(filters.minPrice != null ? { price: { gte: filters.minPrice } } : {}),
      ...(filters.maxPrice != null ? { price: { lte: filters.maxPrice } } : {}),
      ...(filters.bedrooms != null ? { bedrooms: { gte: filters.bedrooms } } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
        include: { images: { where: { isPrimary: true }, take: 1 } },
      }),
      prisma.property.count({ where }),
    ]);

    const totalPages = Math.ceil(total / filters.limit);

    return {
      data: data.map((p) => ({
        ...p,
        primaryImage: p.images[0] ?? null,
      })),
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages,
      hasMore: filters.page < totalPages,
    };
  } catch {
    return filterMockProperties({ ...filters, limit: 12 });
  }
}

export default async function PropertiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialData = await getProperties(params);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-primary">
            NyumbaHub Kenya
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/properties" className="font-medium text-primary">
              Properties
            </Link>
            <Link href="/agents" className="text-muted-foreground hover:text-foreground">
              Agents
            </Link>
            <Link href="/blog" className="text-muted-foreground hover:text-foreground">
              Blog
            </Link>
            <Link href="/login" className="text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Properties in Kenya</h1>
          <p className="mt-2 text-muted-foreground">
            Browse verified homes, land, and commercial spaces from Nairobi to the
            coast.
          </p>
        </div>

        <Suspense fallback={<div className="py-12 text-center">Loading listings…</div>}>
          <PropertySearchClient initialData={initialData} />
        </Suspense>
      </main>
    </div>
  );
}
