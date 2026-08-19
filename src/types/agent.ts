export interface FeaturedAgent {
  id: string;
  name: string;
  slug: string;
  agency: string;
  county: string;
  rating: number;
  reviewCount: number;
  listingsCount: number;
  image: string | null;
  specialties: string[];
  phone?: string;
  showListings?: boolean;
}
