"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  LISTING_FEATURE_GROUPS,
  type ListingFeatureSlug,
} from "@/lib/listing-features";

export function ListingFeaturesPicker({
  value,
  onChange,
  listingType,
}: {
  value: string[];
  onChange: (next: ListingFeatureSlug[]) => void;
  listingType?: string;
}) {
  const selected = new Set(value);
  const hotelGroupIds = ["hotel", "utilities", "security-parking", "outdoor"];
  const groups =
    listingType === "HOTEL"
      ? hotelGroupIds
          .map((id) => LISTING_FEATURE_GROUPS.find((group) => group.id === id))
          .filter(
            (group): group is (typeof LISTING_FEATURE_GROUPS)[number] =>
              Boolean(group),
          )
      : LISTING_FEATURE_GROUPS;

  function toggle(slug: ListingFeatureSlug, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(slug);
    else next.delete(slug);
    onChange([...next] as ListingFeatureSlug[]);
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.id}>
          <p className="mb-3 text-sm font-semibold">{group.label}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {group.features.map((feature) => {
              const id = `feature-${feature.slug}`;
              const checked = selected.has(feature.slug);
              return (
                <label
                  key={feature.slug}
                  htmlFor={id}
                  className="flex cursor-pointer items-start gap-2 rounded-lg border bg-card px-3 py-2 text-sm leading-snug hover:border-primary/40"
                >
                  <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={(state) =>
                      toggle(feature.slug, state === true)
                    }
                    className="mt-0.5"
                  />
                  <span>{feature.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
