/**
 * In-memory listing store used when Postgres is unavailable (local demo).
 * Cleared on server restart.
 */

export type DemoListingStatus =
  | "DRAFT"
  | "PENDING"
  | "ACTIVE"
  | "REJECTED"
  | "ARCHIVED";

export interface DemoListingImage {
  url: string;
  publicId?: string | null;
  alt?: string | null;
  isPrimary?: boolean;
  order?: number;
}

export interface DemoListing {
  id: string;
  title: string;
  slug: string;
  description: string;
  listingType: string;
  propertyType: string;
  price: number;
  currency: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  county: string;
  town: string;
  estate?: string | null;
  status: DemoListingStatus;
  views: number;
  ownerId: string;
  ownerName?: string | null;
  ownerEmail?: string | null;
  rejectionReason?: string | null;
  images?: DemoListingImage[];
  createdAt: string;
  updatedAt: string;
}

const globalForListings = globalThis as unknown as {
  nyumbaPendingListings?: DemoListing[];
};

if (!globalForListings.nyumbaPendingListings) {
  globalForListings.nyumbaPendingListings = [
    {
      id: "pending-demo-1",
      title: "Sunny 2BR Apartment in Syokimau",
      slug: "sunny-2br-apartment-syokimau",
      description:
        "Fresh listing awaiting admin review. Gated community with parking and borehole water.",
      listingType: "RENT",
      propertyType: "APARTMENT",
      price: 45000,
      currency: "KES",
      bedrooms: 2,
      bathrooms: 1,
      county: "Machakos",
      town: "Syokimau",
      estate: "Green Park",
      status: "PENDING",
      views: 42,
      ownerId: "demo-seller",
      ownerName: "Grace Wanjiku",
      ownerEmail: "seller@nyumbahub.co.ke",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export const demoListings = globalForListings.nyumbaPendingListings;

export function addDemoListing(
  listing: Omit<DemoListing, "id" | "createdAt" | "updatedAt" | "slug" | "views"> & {
    slug?: string;
    views?: number;
  },
): DemoListing {
  const id = `listing-${Date.now()}`;
  const slug =
    listing.slug ??
    listing.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const created: DemoListing = {
    ...listing,
    id,
    views: listing.views ?? 0,
    slug: `${slug}-${id.slice(-4)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  demoListings.unshift(created);
  return created;
}

export function getDemoListing(id: string) {
  return demoListings.find((l) => l.id === id) ?? null;
}

export function getPendingDemoListings() {
  return demoListings.filter((l) => l.status === "PENDING");
}

export function updateDemoListingStatus(
  id: string,
  status: DemoListingStatus,
  rejectionReason?: string,
) {
  const listing = demoListings.find((l) => l.id === id);
  if (!listing) return null;
  listing.status = status;
  listing.rejectionReason = rejectionReason ?? null;
  listing.updatedAt = new Date().toISOString();
  return listing;
}

export function updateDemoListing(
  id: string,
  patch: Partial<
    Omit<DemoListing, "id" | "createdAt" | "ownerId" | "ownerEmail" | "ownerName">
  >,
) {
  const listing = demoListings.find((l) => l.id === id);
  if (!listing) return null;
  Object.assign(listing, patch, { updatedAt: new Date().toISOString() });
  return listing;
}

export function deleteDemoListing(id: string) {
  const index = demoListings.findIndex((l) => l.id === id);
  if (index === -1) return false;
  demoListings.splice(index, 1);
  return true;
}
