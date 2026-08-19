import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PropertySearchClient } from "@/components/properties/property-search";
import { searchProperties } from "@/lib/properties";
import { buildPropertiesSearchMetadata } from "@/lib/seo";
import { propertySearchSchema } from "@/lib/validations/property";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  return buildPropertiesSearchMetadata(params);
}

// This page must reflect the latest ACTIVE/RUNTED status changes immediately.
export const dynamic = "force-dynamic";

async function getProperties(searchParams: Record<string, string | string[] | undefined>) {
  const raw: Record<string, string> = {};
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") raw[key] = value;
  }

  const parsed = propertySearchSchema.safeParse(raw);
  const filters = parsed.success ? parsed.data : { page: 1, limit: 12 };

  return searchProperties({ ...filters, limit: filters.limit ?? 12 });
}

export default async function PropertiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialData = await getProperties(params);
  const agentId =
    typeof params.agentId === "string" ? params.agentId : undefined;
  const category =
    typeof params.category === "string" ? params.category : undefined;

  const pageTitle =
    category === "land-plots"
      ? "Land & plots in Kenya"
      : category === "commercial"
        ? "Commercial property in Kenya"
        : agentId
          ? "Agent listings"
          : "Properties in Kenya";

  const pageDescription =
    category === "land-plots"
      ? "Browse vacant land, plots, and farms for sale across Kenya."
      : category === "commercial"
        ? "Offices, shops, and warehouse spaces for sale and rent."
        : agentId
          ? "Active homes listed by this agent on Your Home."
          : "Browse verified homes, land, and commercial spaces from Nairobi to the coast.";

  return (
    <div className="min-h-dvh bg-background">
      <main className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl">{pageTitle}</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            {pageDescription}
          </p>
          {agentId ? (
            <p className="mt-3">
              <Link href="/agents" className="text-sm text-primary hover:underline">
                ← Back to agents
              </Link>
            </p>
          ) : null}
        </div>

        <Suspense fallback={<div className="py-12 text-center">Loading listings…</div>}>
          <PropertySearchClient initialData={initialData} />
        </Suspense>
      </main>
    </div>
  );
}
