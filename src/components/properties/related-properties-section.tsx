import { Suspense } from "react";

import { PropertyCardItem } from "@/components/properties/property-card";
import { PropertyCardSkeleton } from "@/components/properties/property-card";
import { getRelatedProperties } from "@/lib/properties";

async function RelatedPropertiesList({
  slug,
  county,
}: {
  slug: string;
  county: string;
}) {
  const related = await getRelatedProperties(slug, county, 3);

  if (related.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Similar properties</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((p) => (
          <PropertyCardItem key={p.id} property={p} />
        ))}
      </div>
    </section>
  );
}

function RelatedPropertiesFallback() {
  return (
    <section aria-hidden="true">
      <div className="mb-4 h-7 w-48 animate-pulse rounded bg-muted" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export function RelatedPropertiesSection({
  slug,
  county,
}: {
  slug: string;
  county: string;
}) {
  return (
    <Suspense fallback={<RelatedPropertiesFallback />}>
      <RelatedPropertiesList slug={slug} county={county} />
    </Suspense>
  );
}
