export type Role = "BUYER" | "SELLER" | "AGENT" | "ADMIN";

export type ListingType = "BUY" | "RENT" | "LAND" | "COMMERCIAL" | "HOLIDAY";

export type PropertyType =
  | "APARTMENT"
  | "HOUSE"
  | "TOWNHOUSE"
  | "VILLA"
  | "STUDIO"
  | "BUNGALOW"
  | "MAISONETTE"
  | "PENTHOUSE"
  | "OFFICE"
  | "SHOP"
  | "WAREHOUSE"
  | "PLOT"
  | "FARM"
  | "OTHER";

export type PropertyStatus =
  | "DRAFT"
  | "PENDING"
  | "ACTIVE"
  | "SOLD"
  | "RENTED"
  | "EXPIRED"
  | "REJECTED"
  | "ARCHIVED";

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "VIEWING_SCHEDULED"
  | "NEGOTIATING"
  | "WON"
  | "LOST";

export type PaymentStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

export type SubscriptionPlan =
  | "FREE"
  | "BASIC"
  | "PREMIUM"
  | "AGENT_PRO"
  | "AGENT_ENTERPRISE";

export type SubscriptionStatus =
  | "ACTIVE"
  | "CANCELLED"
  | "EXPIRED"
  | "PAST_DUE";

export interface PropertyImageSummary {
  id: string;
  url: string;
  alt?: string | null;
  isPrimary: boolean;
  order: number;
}

export interface PropertyCard {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  listingType: ListingType;
  propertyType: PropertyType;
  status: PropertyStatus;
  bedrooms?: number | null;
  bathrooms?: number | null;
  county: string;
  town: string;
  estate?: string | null;
  parkingSpaces: number;
  furnished: boolean;
  swimmingPool: boolean;
  security: boolean;
  isFeatured: boolean;
  isPremium: boolean;
  isVerified: boolean;
  views: number;
  publishedAt?: Date | string | null;
  primaryImage?: PropertyImageSummary | null;
  images?: PropertyImageSummary[];
  /** Optional: presence of video links for marketplace cards */
  videos?: Array<{
    url: string;
    title?: string | null;
  }>;
  /** Multi-room RENT inventory */
  rentalRoomsAvailable?: number;
  rentalRoomsTotal?: number;
  host?: ListingHostSummary | null;
}

export interface ListingHostSummary {
  id: string;
  name: string;
  image?: string | null;
  role?: string;
  isVerified?: boolean;
  agencyName?: string | null;
  agentProfileId?: string | null;
}

export interface PropertyDetail extends PropertyCard {
  description: string;
  floorArea?: number | null;
  plotSize?: number | null;
  yearBuilt?: number | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  ownerId: string;
  agentId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SearchFilters {
  query?: string;
  listingType?: ListingType;
  propertyType?: PropertyType;
  county?: string;
  town?: string;
  estate?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  parking?: boolean;
  swimmingPool?: boolean;
  furnished?: boolean;
  security?: boolean;
  isFeatured?: boolean;
  isVerified?: boolean;
  sortBy?: "newest" | "price_asc" | "price_desc" | "popular";
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface DashboardStats {
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  totalViews: number;
  totalLeads: number;
  newLeads: number;
  conversionRate: number;
  featuredListings: number;
  premiumListings: number;
}

export interface AgentDashboardStats extends DashboardStats {
  totalClients: number;
  scheduledViewings: number;
  averageRating: number;
  reviewCount: number;
}

export interface LeadSummary {
  id: string;
  propertyId: string;
  propertyTitle: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  status: LeadStatus;
  createdAt: Date | string;
}

export interface UserSession {
  id: string;
  name?: string | null;
  email: string;
  phone?: string | null;
  image?: string | null;
  role: Role;
}

export interface SubscriptionSummary {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: Date | string;
  endDate?: Date | string | null;
  autoRenew: boolean;
  amount: number;
  currency: string;
}

export interface PaymentSummary {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: string;
  reference?: string | null;
  description?: string | null;
  createdAt: Date | string;
}

export interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  category: string;
  tags: string[];
  published: boolean;
  publishedAt?: Date | string | null;
  views: number;
  author: {
    id: string;
    name?: string | null;
    image?: string | null;
  };
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  isRead: boolean;
  createdAt: Date | string;
}

export interface SavedSearchItem {
  id: string;
  name: string;
  filters: SearchFilters;
  alertOn: boolean;
  createdAt: Date | string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

declare module "next-auth" {
  interface Session {
    user: UserSession;
  }

  interface User {
    role: Role;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

export {};
