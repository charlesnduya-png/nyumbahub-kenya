export const LISTING_FEATURE_GROUPS = [
  {
    id: "interior",
    label: "Interior & lifestyle",
    features: [
      { slug: "family-tv-room", name: "Family / TV room" },
      { slug: "home-office-study", name: "Home office / study" },
      { slug: "fireplace", name: "Fireplace" },
      { slug: "balcony", name: "Balcony" },
      { slug: "laundry-room", name: "Laundry room" },
      { slug: "guest-house", name: "Guest house" },
      { slug: "walk-in-closet", name: "Walk-in closet" },
      { slug: "ensuite", name: "En-suite bedrooms" },
      { slug: "staff-quarters", name: "Staff quarters" },
      { slug: "furnished", name: "Furnished" },
      { slug: "gourmet-kitchen", name: "Gourmet kitchen" },
      { slug: "wine-cellar", name: "Wine cellar" },
      { slug: "home-cinema", name: "Home cinema" },
      { slug: "smart-home", name: "Smart home" },
      { slug: "spa-sauna", name: "Spa / sauna" },
      { slug: "private-gym", name: "Private gym" },
    ],
  },
  {
    id: "outdoor",
    label: "Outdoor",
    features: [
      { slug: "swimming-pool", name: "Swimming pool" },
      { slug: "garden", name: "Garden" },
      { slug: "manicured-lawn", name: "Manicured lawn" },
      { slug: "patio-terrace", name: "Patio / terrace" },
      { slug: "bbq-area", name: "BBQ / outdoor kitchen" },
      { slug: "rooftop", name: "Rooftop" },
      { slug: "tennis-court", name: "Tennis / sports court" },
      { slug: "playground", name: "Children's playground" },
      { slug: "scenic-view", name: "Scenic / city view" },
      { slug: "waterfront", name: "Waterfront / lake view" },
    ],
  },
  {
    id: "utilities",
    label: "Utilities",
    features: [
      { slug: "backup-generator", name: "Backup generator" },
      { slug: "solar-power", name: "Solar power" },
      { slug: "borehole", name: "Borehole / own water" },
      { slug: "water-tank", name: "Water tank / backup" },
      { slug: "fibre-internet", name: "Fibre internet" },
      { slug: "air-conditioning", name: "Air conditioning" },
      { slug: "elevator", name: "Lift / elevator" },
      { slug: "backup-inverter", name: "Inverter / backup power" },
    ],
  },
  {
    id: "security-parking",
    label: "Security & parking",
    features: [
      { slug: "security-24-7", name: "24/7 security" },
      { slug: "cctv", name: "CCTV" },
      { slug: "electric-fence", name: "Electric fence" },
      { slug: "gated-community", name: "Gated community" },
      { slug: "alarm-system", name: "Alarm system" },
      { slug: "garage", name: "Garage" },
      { slug: "covered-parking", name: "Covered parking" },
      { slug: "ample-parking", name: "Ample parking" },
      { slug: "visitor-parking", name: "Visitor parking" },
    ],
  },
  {
    id: "premium",
    label: "Premium location",
    features: [
      { slug: "un-embassy-approved", name: "UN / embassy approved" },
      { slug: "diplomatic-area", name: "Diplomatic area" },
      { slug: "near-international-school", name: "Near international school" },
      { slug: "near-shopping-centres", name: "Near shopping centres" },
      { slug: "golf-estate", name: "Golf estate" },
      { slug: "airport-access", name: "Near airport" },
    ],
  },
  {
    id: "hotel-services",
    label: "Hotel services",
    features: [
      { slug: "reception-24h", name: "24-hour reception" },
      { slug: "concierge", name: "Concierge" },
      { slug: "room-service", name: "Room service" },
      { slug: "laundry-service", name: "Laundry / dry cleaning" },
      { slug: "daily-housekeeping", name: "Daily housekeeping" },
      { slug: "luggage-storage", name: "Luggage storage" },
      { slug: "airport-shuttle", name: "Airport shuttle" },
      { slug: "wheelchair-access", name: "Wheelchair accessible" },
    ],
  },
  {
    id: "hotel-room",
    label: "In the room",
    features: [
      { slug: "free-wifi", name: "Free WiFi" },
      { slug: "tv-in-room", name: "TV in room" },
      { slug: "work-desk", name: "Work desk" },
      { slug: "mini-fridge", name: "Mini fridge" },
      { slug: "in-room-safe", name: "In-room safe" },
      { slug: "kitchenette", name: "Kitchenette" },
      { slug: "family-rooms", name: "Family rooms" },
      { slug: "baby-cot", name: "Baby cot on request" },
    ],
  },
  {
    id: "hotel-dining",
    label: "Food & drink",
    features: [
      { slug: "breakfast-included", name: "Breakfast included" },
      { slug: "restaurant", name: "Restaurant" },
      { slug: "bar-lounge", name: "Bar / lounge" },
      { slug: "coffee-shop", name: "Coffee shop" },
    ],
  },
  {
    id: "hotel-wellness",
    label: "Pool, spa & gym",
    features: [
      { slug: "hotel-pool", name: "Hotel swimming pool" },
      { slug: "hotel-spa", name: "Spa" },
      { slug: "hotel-gym", name: "Fitness centre" },
      { slug: "hotel-sauna", name: "Sauna / steam" },
    ],
  },
  {
    id: "hotel-business",
    label: "Business & meetings",
    features: [
      { slug: "conference-room", name: "Conference / meeting rooms" },
      { slug: "business-centre", name: "Business centre" },
    ],
  },
  {
    id: "hotel-access",
    label: "Parking, power & security",
    features: [
      { slug: "complimentary-parking", name: "Free on-site parking" },
      { slug: "secure-hotel-parking", name: "Secure parking" },
      { slug: "hotel-generator", name: "Hotel backup generator" },
      { slug: "hotel-security", name: "24-hour hotel security" },
      { slug: "hotel-cctv", name: "Hotel CCTV cameras" },
      { slug: "hotel-lift", name: "Guest lift" },
    ],
  },
] as const;

const HOTEL_GROUP_PREFIX = "hotel-";

export function isHotelFeatureGroupId(id: string) {
  return id.startsWith(HOTEL_GROUP_PREFIX);
}

export function featureGroupsForListingType(listingType?: string) {
  if (listingType === "HOTEL") {
    return LISTING_FEATURE_GROUPS.filter((group) =>
      isHotelFeatureGroupId(group.id),
    );
  }
  return LISTING_FEATURE_GROUPS.filter(
    (group) => !isHotelFeatureGroupId(group.id),
  );
}

export const DEFAULT_HOTEL_FEATURES = [
  "reception-24h",
  "free-wifi",
  "breakfast-included",
  "hotel-security",
] as const;

export type ListingFeatureGroupId =
  (typeof LISTING_FEATURE_GROUPS)[number]["id"];

export type ListingFeatureSlug =
  (typeof LISTING_FEATURE_GROUPS)[number]["features"][number]["slug"];

export type ListingFeature = {
  slug: string;
  name: string;
  groupId: ListingFeatureGroupId;
  groupLabel: string;
};

export const LISTING_FEATURES: ListingFeature[] = LISTING_FEATURE_GROUPS.flatMap(
  (group) =>
    group.features.map((feature) => ({
      slug: feature.slug,
      name: feature.name,
      groupId: group.id,
      groupLabel: group.label,
    })),
);

const FEATURES_BY_SLUG = new Map(
  LISTING_FEATURES.map((feature) => [feature.slug, feature]),
);

const FEATURES_BY_NAME = new Map(
  LISTING_FEATURES.map((feature) => [feature.name.toLowerCase(), feature]),
);

const NAME_ALIASES: Record<string, string> = {
  gym: "private-gym",
  parking: "ample-parking",
  borehole: "borehole",
  "backup generator": "backup-generator",
  "fibre internet": "fibre-internet",
  "24/7 security": "security-24-7",
  "swimming pool": "swimming-pool",
  wifi: "free-wifi",
  "free wifi": "free-wifi",
  restaurant: "restaurant",
  spa: "hotel-spa",
};

export const LISTING_FEATURE_SLUGS = LISTING_FEATURES.map(
  (feature) => feature.slug,
) as [ListingFeatureSlug, ...ListingFeatureSlug[]];

export function isListingFeatureSlug(value: string): value is ListingFeatureSlug {
  return FEATURES_BY_SLUG.has(value);
}

export function listingFeatureBySlug(slug: string) {
  return FEATURES_BY_SLUG.get(slug) ?? null;
}

export function sanitizeListingFeatureSlugs(slugs: string[] | undefined | null) {
  if (!slugs?.length) return [] as ListingFeatureSlug[];
  const unique = new Set<ListingFeatureSlug>();
  for (const raw of slugs) {
    const slug = raw.trim();
    if (isListingFeatureSlug(slug)) unique.add(slug);
  }
  return [...unique];
}

export function listingFeatureSlugsFromAmenities(
  amenities:
    | Array<{ amenity?: { name?: string | null; icon?: string | null } | null }>
    | undefined
    | null,
) {
  if (!amenities?.length) return [] as ListingFeatureSlug[];
  const unique = new Set<ListingFeatureSlug>();
  for (const row of amenities) {
    const icon = row.amenity?.icon?.trim();
    const name = row.amenity?.name?.trim().toLowerCase();
    const fromIcon = icon ? FEATURES_BY_SLUG.get(icon) : null;
    const aliasSlug = name ? NAME_ALIASES[name] : undefined;
    const fromAlias = aliasSlug ? FEATURES_BY_SLUG.get(aliasSlug) : null;
    const fromName = name ? FEATURES_BY_NAME.get(name) : null;
    const match = fromIcon ?? fromAlias ?? fromName;
    if (match) unique.add(match.slug as ListingFeatureSlug);
  }
  return [...unique];
}

export function flagsFromListingFeatures(slugs: string[]) {
  const set = new Set(sanitizeListingFeatureSlugs(slugs));
  const parking =
    set.has("garage") ||
    set.has("covered-parking") ||
    set.has("ample-parking") ||
    set.has("visitor-parking") ||
    set.has("complimentary-parking") ||
    set.has("secure-hotel-parking");
  return {
    furnished: set.has("furnished") || set.has("kitchenette"),
    swimmingPool: set.has("swimming-pool") || set.has("hotel-pool"),
    security: set.has("security-24-7") || set.has("hotel-security"),
    parking,
  };
}

export function groupedListingFeatures(
  slugs: string[],
  listingType?: string,
) {
  const selected = new Set(sanitizeListingFeatureSlugs(slugs));
  const groups = listingType
    ? featureGroupsForListingType(listingType)
    : LISTING_FEATURE_GROUPS;
  return groups
    .map((group) => ({
      id: group.id,
      label: group.label,
      features: group.features.filter((feature) => selected.has(feature.slug)),
    }))
    .filter((group) => group.features.length > 0);
}
