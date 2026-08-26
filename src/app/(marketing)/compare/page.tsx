import type { Metadata } from "next";
import { Suspense } from "react";
import { getPropertiesByIds } from "@/lib/properties";
import ComparePageClient from "./compare-client";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface ComparePageProps {
  searchParams: Promise<{ ids?: string }>;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { ids: idsParam } = await searchParams;
  const ids = idsParam?.split(",").filter(Boolean) ?? [];
  const compared = await getPropertiesByIds(ids);

  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-12">Loading comparison…</div>}>
      <ComparePageClient compared={compared} />
    </Suspense>
  );
}
