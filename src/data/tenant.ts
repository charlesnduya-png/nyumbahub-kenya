export interface TenantSavedHome {
  id: string;
  title: string;
  slug: string;
  price: number;
  town: string;
  county: string;
  listingType: string;
  bedrooms?: number;
  image: string;
}

export interface TenantInquiry {
  id: string;
  propertyTitle: string;
  propertySlug: string;
  status: "SENT" | "REPLIED" | "VIEWING" | "CLOSED";
  message: string;
  createdAt: string;
}

export interface TenantViewing {
  id: string;
  propertyTitle: string;
  propertySlug: string;
  scheduledAt: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  agentName: string;
  location: string;
}

export const tenantSavedHomes: TenantSavedHome[] = [
  {
    id: "prop-1",
    title: "Modern 3BR Apartment in Kilimani",
    slug: "modern-3br-apartment-kilimani",
    price: 18500000,
    town: "Kilimani",
    county: "Nairobi",
    listingType: "BUY",
    bedrooms: 3,
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "prop-3",
    title: "Furnished 2BR in Westlands",
    slug: "2br-apartment-rent-westlands",
    price: 95000,
    town: "Westlands",
    county: "Nairobi",
    listingType: "RENT",
    bedrooms: 2,
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "prop-5",
    title: "1/8 Acre Plot in Kitengela",
    slug: "eighth-acre-plot-kitengela",
    price: 3200000,
    town: "Kitengela",
    county: "Kajiado",
    listingType: "LAND",
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
  },
];

export const tenantInquiries: TenantInquiry[] = [
  {
    id: "ti-1",
    propertyTitle: "Modern 3BR Apartment in Kilimani",
    propertySlug: "modern-3br-apartment-kilimani",
    status: "REPLIED",
    message: "I would like to view this Saturday morning.",
    createdAt: "2026-08-02T10:00:00.000Z",
  },
  {
    id: "ti-2",
    propertyTitle: "Furnished 2BR in Westlands",
    propertySlug: "2br-apartment-rent-westlands",
    status: "VIEWING",
    message: "Is the rent inclusive of water and service charge?",
    createdAt: "2026-08-01T14:20:00.000Z",
  },
  {
    id: "ti-3",
    propertyTitle: "1/8 Acre Plot in Kitengela",
    propertySlug: "eighth-acre-plot-kitengela",
    status: "SENT",
    message: "Is the title deed ready for transfer?",
    createdAt: "2026-07-30T09:15:00.000Z",
  },
];

export const tenantViewings: TenantViewing[] = [
  {
    id: "tv-1",
    propertyTitle: "Furnished 2BR in Westlands",
    propertySlug: "2br-apartment-rent-westlands",
    scheduledAt: "2026-08-05T10:00:00.000Z",
    status: "SCHEDULED",
    agentName: "David Ochieng",
    location: "Mpaka Road, Westlands",
  },
  {
    id: "tv-2",
    propertyTitle: "Modern 3BR Apartment in Kilimani",
    propertySlug: "modern-3br-apartment-kilimani",
    scheduledAt: "2026-08-06T15:30:00.000Z",
    status: "SCHEDULED",
    agentName: "Grace Wanjiku",
    location: "State House Crescent, Kilimani",
  },
];

export const tenantStats = {
  savedHomes: tenantSavedHomes.length,
  openInquiries: tenantInquiries.filter((i) => i.status !== "CLOSED").length,
  upcomingViewings: tenantViewings.filter((v) => v.status === "SCHEDULED")
    .length,
  recentlyViewed: 6,
};
