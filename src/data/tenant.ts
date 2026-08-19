/** Types only — tenant dashboard loads real user data from the database. */

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
