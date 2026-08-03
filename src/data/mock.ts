import type { PropertySearchInput } from "@/lib/validations/property";
import type { BlogPostSummary, PropertyCard } from "@/types";

const unsplash = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export interface MockAgent {
  id: string;
  name: string;
  slug: string;
  agency: string;
  county: string;
  rating: number;
  reviewCount: number;
  listingsCount: number;
  image: string;
  specialties: string[];
}

export interface MockTestimonial {
  id: string;
  name: string;
  role: string;
  location: string;
  quote: string;
  rating: number;
  avatar: string;
}

export interface MockLocation {
  name: string;
  slug: string;
  county: string;
  listingCount: number;
  image: string;
}

export interface MockCategory {
  label: string;
  slug: string;
  propertyType: string;
  listingCount: number;
  image: string;
}

function property(
  partial: Omit<PropertyCard, "currency" | "status" | "parkingSpaces" | "furnished" | "swimmingPool" | "security" | "views"> &
    Partial<Pick<PropertyCard, "currency" | "status" | "parkingSpaces" | "furnished" | "swimmingPool" | "security" | "views">>,
): PropertyCard {
  const imageUrl = partial.primaryImage?.url ?? unsplash("photo-1600585154340-be6161a56a0c");
  return {
    currency: "KES",
    status: "ACTIVE",
    parkingSpaces: 1,
    furnished: false,
    swimmingPool: false,
    security: true,
    views: 120,
    ...partial,
    primaryImage: partial.primaryImage ?? {
      id: `${partial.id}-img`,
      url: imageUrl,
      alt: partial.title,
      isPrimary: true,
      order: 0,
    },
  };
}

export const mockProperties: PropertyCard[] = [
  property({
    id: "prop-1",
    title: "Modern 3BR Apartment in Kilimani",
    slug: "modern-3br-apartment-kilimani",
    price: 18500000,
    listingType: "BUY",
    propertyType: "APARTMENT",
    bedrooms: 3,
    bathrooms: 2,
    county: "Nairobi",
    town: "Kilimani",
    estate: "Ring Road Kilimani",
    isFeatured: true,
    isPremium: true,
    isVerified: true,
    views: 842,
    publishedAt: "2026-07-15",
    primaryImage: {
      id: "prop-1-img",
      url: unsplash("photo-1600596542815-ffad4c1539a9"),
      alt: "Modern apartment in Kilimani",
      isPrimary: true,
      order: 0,
    },
  }),
  property({
    id: "prop-2",
    title: "Luxury Villa with Pool in Karen",
    slug: "luxury-villa-pool-karen",
    price: 85000000,
    listingType: "BUY",
    propertyType: "VILLA",
    bedrooms: 5,
    bathrooms: 5,
    county: "Nairobi",
    town: "Karen",
    estate: "Karen Hardy",
    swimmingPool: true,
    parkingSpaces: 3,
    isFeatured: true,
    isPremium: true,
    isVerified: true,
    views: 1204,
    publishedAt: "2026-07-10",
    primaryImage: {
      id: "prop-2-img",
      url: unsplash("photo-1613490493576-7fde63acd811"),
      alt: "Luxury villa in Karen",
      isPrimary: true,
      order: 0,
    },
  }),
  property({
    id: "prop-3",
    title: "Furnished 2BR in Westlands",
    slug: "furnished-2br-westlands",
    price: 95000,
    listingType: "RENT",
    propertyType: "APARTMENT",
    bedrooms: 2,
    bathrooms: 2,
    county: "Nairobi",
    town: "Westlands",
    estate: "Sarit Centre Area",
    furnished: true,
    isFeatured: false,
    isPremium: false,
    isVerified: true,
    views: 567,
    publishedAt: "2026-07-28",
    primaryImage: {
      id: "prop-3-img",
      url: unsplash("photo-1502672260266-1c1ef2d93688"),
      alt: "Furnished apartment Westlands",
      isPrimary: true,
      order: 0,
    },
  }),
  property({
    id: "prop-4",
    title: "Beachfront Apartment in Nyali",
    slug: "beachfront-apartment-nyali",
    price: 32000000,
    listingType: "BUY",
    propertyType: "APARTMENT",
    bedrooms: 3,
    bathrooms: 3,
    county: "Mombasa",
    town: "Nyali",
    estate: "Nyali Beach",
    isFeatured: true,
    isPremium: false,
    isVerified: true,
    views: 934,
    publishedAt: "2026-06-20",
    primaryImage: {
      id: "prop-4-img",
      url: unsplash("photo-1512917774080-9991f1c4c750"),
      alt: "Beachfront apartment Nyali",
      isPrimary: true,
      order: 0,
    },
  }),
  property({
    id: "prop-5",
    title: "Prime Commercial Space Upper Hill",
    slug: "commercial-space-upper-hill",
    price: 450000,
    listingType: "RENT",
    propertyType: "OFFICE",
    bedrooms: null,
    bathrooms: 2,
    county: "Nairobi",
    town: "Upper Hill",
    estate: "Upper Hill Road",
    parkingSpaces: 5,
    isFeatured: false,
    isPremium: true,
    isVerified: true,
    views: 412,
    publishedAt: "2026-07-01",
    primaryImage: {
      id: "prop-5-img",
      url: unsplash("photo-1486406146926-c627a92ad1ab"),
      alt: "Commercial office Upper Hill",
      isPrimary: true,
      order: 0,
    },
  }),
  property({
    id: "prop-6",
    title: "Half-Acre Plot in Kiambu Road",
    slug: "half-acre-plot-kiambu-road",
    price: 12000000,
    listingType: "LAND",
    propertyType: "PLOT",
    bedrooms: null,
    bathrooms: null,
    county: "Kiambu",
    town: "Ruiru",
    estate: "Kiambu Road",
    isFeatured: false,
    isPremium: false,
    isVerified: true,
    views: 289,
    publishedAt: "2026-06-15",
    primaryImage: {
      id: "prop-6-img",
      url: unsplash("photo-1500382017468-9049fed747ef"),
      alt: "Land plot Kiambu Road",
      isPrimary: true,
      order: 0,
    },
  }),
  property({
    id: "prop-7",
    title: "Maisonette in Syokimau",
    slug: "maisonette-syokimau",
    price: 14500000,
    listingType: "BUY",
    propertyType: "MAISONETTE",
    bedrooms: 4,
    bathrooms: 3,
    county: "Machakos",
    town: "Syokimau",
    estate: "Gateway Mall Area",
    parkingSpaces: 2,
    isFeatured: true,
    isPremium: false,
    isVerified: false,
    views: 678,
    publishedAt: "2026-07-20",
    primaryImage: {
      id: "prop-7-img",
      url: unsplash("photo-1600607687939-ce8a6c25118c"),
      alt: "Maisonette Syokimau",
      isPrimary: true,
      order: 0,
    },
  }),
  property({
    id: "prop-8",
    title: "Holiday Home in Diani",
    slug: "holiday-home-diani",
    price: 25000,
    listingType: "HOLIDAY",
    propertyType: "VILLA",
    bedrooms: 4,
    bathrooms: 4,
    county: "Kwale",
    town: "Diani",
    estate: "Diani Beach",
    swimmingPool: true,
    furnished: true,
    isFeatured: true,
    isPremium: true,
    isVerified: true,
    views: 1102,
    publishedAt: "2026-07-05",
    primaryImage: {
      id: "prop-8-img",
      url: unsplash("photo-1582268611958-ebfd161ef9cf"),
      alt: "Holiday home Diani",
      isPrimary: true,
      order: 0,
    },
  }),
  property({
    id: "prop-9",
    title: "Studio Apartment Kisumu CBD",
    slug: "studio-apartment-kisumu-cbd",
    price: 35000,
    listingType: "RENT",
    propertyType: "STUDIO",
    bedrooms: 1,
    bathrooms: 1,
    county: "Kisumu",
    town: "Kisumu CBD",
    furnished: true,
    isFeatured: false,
    isPremium: false,
    isVerified: true,
    views: 234,
    publishedAt: "2026-07-25",
    primaryImage: {
      id: "prop-9-img",
      url: unsplash("photo-1522708323590-d24dbb6b0267"),
      alt: "Studio Kisumu CBD",
      isPrimary: true,
      order: 0,
    },
  }),
  property({
    id: "prop-10",
    title: "Bungalow in Nakuru Section 58",
    slug: "bungalow-nakuru-section-58",
    price: 9800000,
    listingType: "BUY",
    propertyType: "BUNGALOW",
    bedrooms: 3,
    bathrooms: 2,
    county: "Nakuru",
    town: "Section 58",
    parkingSpaces: 2,
    isFeatured: false,
    isPremium: false,
    isVerified: true,
    views: 445,
    publishedAt: "2026-06-28",
    primaryImage: {
      id: "prop-10-img",
      url: unsplash("photo-1564013799919-ab600027ffc6"),
      alt: "Bungalow Nakuru",
      isPrimary: true,
      order: 0,
    },
  }),
  property({
    id: "prop-11",
    title: "Retail Shop on Tom Mboya Street",
    slug: "retail-shop-tom-mboya",
    price: 180000,
    listingType: "COMMERCIAL",
    propertyType: "SHOP",
    bedrooms: null,
    bathrooms: 1,
    county: "Nairobi",
    town: "Nairobi CBD",
    estate: "Tom Mboya Street",
    isFeatured: false,
    isPremium: false,
    isVerified: true,
    views: 312,
    publishedAt: "2026-07-12",
    primaryImage: {
      id: "prop-11-img",
      url: unsplash("photo-1441986300917-64674bd600d8"),
      alt: "Retail shop Nairobi CBD",
      isPrimary: true,
      order: 0,
    },
  }),
  property({
    id: "prop-12",
    title: "Penthouse with City Views in Runda",
    slug: "penthouse-city-views-runda",
    price: 120000000,
    listingType: "BUY",
    propertyType: "PENTHOUSE",
    bedrooms: 4,
    bathrooms: 4,
    county: "Nairobi",
    town: "Runda",
    estate: "Runda Grove",
    parkingSpaces: 3,
    swimmingPool: true,
    isFeatured: true,
    isPremium: true,
    isVerified: true,
    views: 1567,
    publishedAt: "2026-07-18",
    primaryImage: {
      id: "prop-12-img",
      url: unsplash("photo-1600607687939-ce8a6c25118c"),
      alt: "Penthouse Runda",
      isPrimary: true,
      order: 0,
    },
  }),
  property({
    id: "prop-13",
    title: "3BR Maisonette to Let — Lavington",
    slug: "3br-maisonette-rent-lavington",
    price: 180000,
    listingType: "RENT",
    propertyType: "MAISONETTE",
    bedrooms: 3,
    bathrooms: 3,
    county: "Nairobi",
    town: "Lavington",
    estate: "James Gichuru Road",
    parkingSpaces: 2,
    security: true,
    swimmingPool: false,
    furnished: false,
    isFeatured: true,
    isVerified: true,
    views: 412,
    publishedAt: "2026-08-01",
    primaryImage: {
      id: "prop-13-img",
      url: unsplash("photo-1560448204-e02f11c3d0e2"),
      alt: "Maisonette Lavington rental",
      isPrimary: true,
      order: 0,
    },
  }),
  property({
    id: "prop-14",
    title: "Bedsitter in Roysambu",
    slug: "bedsitter-roysambu-rent",
    price: 12000,
    listingType: "RENT",
    propertyType: "STUDIO",
    bedrooms: 1,
    bathrooms: 1,
    county: "Nairobi",
    town: "Roysambu",
    estate: "Thika Road",
    furnished: false,
    security: true,
    isFeatured: false,
    isVerified: true,
    views: 890,
    publishedAt: "2026-08-02",
    primaryImage: {
      id: "prop-14-img",
      url: unsplash("photo-1522708323590-d24dbb6b0267"),
      alt: "Bedsitter Roysambu",
      isPrimary: true,
      order: 0,
    },
  }),
  property({
    id: "prop-15",
    title: "4BR Family House Rent — Syokimau",
    slug: "4br-house-rent-syokimau",
    price: 75000,
    listingType: "RENT",
    propertyType: "HOUSE",
    bedrooms: 4,
    bathrooms: 3,
    county: "Machakos",
    town: "Syokimau",
    estate: "Katani Road",
    parkingSpaces: 2,
    security: true,
    furnished: false,
    isFeatured: true,
    isVerified: true,
    views: 356,
    publishedAt: "2026-07-30",
    primaryImage: {
      id: "prop-15-img",
      url: unsplash("photo-1600585154340-be6161a56a0c"),
      alt: "Family house Syokimau rent",
      isPrimary: true,
      order: 0,
    },
  }),
  property({
    id: "prop-16",
    title: "1BR Apartment South B",
    slug: "1br-apartment-south-b-rent",
    price: 28000,
    listingType: "RENT",
    propertyType: "APARTMENT",
    bedrooms: 1,
    bathrooms: 1,
    county: "Nairobi",
    town: "South B",
    estate: "Mukuru Road",
    furnished: true,
    security: true,
    isFeatured: false,
    isVerified: true,
    views: 501,
    publishedAt: "2026-07-29",
    primaryImage: {
      id: "prop-16-img",
      url: unsplash("photo-1502672260266-1c1ef2d93688"),
      alt: "South B apartment rental",
      isPrimary: true,
      order: 0,
    },
  }),
  property({
    id: "prop-17",
    title: "BnB Villa with Pool — Watamu",
    slug: "bnb-villa-pool-watamu",
    price: 18500,
    listingType: "HOLIDAY",
    propertyType: "VILLA",
    bedrooms: 3,
    bathrooms: 3,
    county: "Kilifi",
    town: "Watamu",
    estate: "Turtle Bay",
    swimmingPool: true,
    furnished: true,
    security: true,
    parkingSpaces: 2,
    isFeatured: true,
    isPremium: true,
    isVerified: true,
    views: 724,
    publishedAt: "2026-08-01",
    primaryImage: {
      id: "prop-17-img",
      url: unsplash("photo-1499793983690-e29da59ef1c2"),
      alt: "Watamu BnB villa",
      isPrimary: true,
      order: 0,
    },
  }),
  property({
    id: "prop-18",
    title: "Naivasha Lake Cottage BnB",
    slug: "naivasha-lake-cottage-bnb",
    price: 12000,
    listingType: "HOLIDAY",
    propertyType: "HOUSE",
    bedrooms: 2,
    bathrooms: 2,
    county: "Nakuru",
    town: "Naivasha",
    estate: "Lake View",
    furnished: true,
    swimmingPool: false,
    security: true,
    isFeatured: true,
    isVerified: true,
    views: 518,
    publishedAt: "2026-07-28",
    primaryImage: {
      id: "prop-18-img",
      url: unsplash("photo-1600585154340-be6161a56a0c"),
      alt: "Naivasha cottage BnB",
      isPrimary: true,
      order: 0,
    },
  }),
  property({
    id: "prop-19",
    title: "Nairobi Airbnb Apartment — Kilimani",
    slug: "nairobi-airbnb-kilimani",
    price: 8500,
    listingType: "HOLIDAY",
    propertyType: "APARTMENT",
    bedrooms: 2,
    bathrooms: 2,
    county: "Nairobi",
    town: "Kilimani",
    estate: "Yaya Centre",
    furnished: true,
    security: true,
    parkingSpaces: 1,
    isFeatured: true,
    isVerified: true,
    views: 961,
    publishedAt: "2026-08-02",
    primaryImage: {
      id: "prop-19-img",
      url: unsplash("photo-1560448204-e02f11c3d0e2"),
      alt: "Kilimani Airbnb apartment",
      isPrimary: true,
      order: 0,
    },
  }),
  property({
    id: "prop-20",
    title: "Malindi Beach BnB House",
    slug: "malindi-beach-bnb-house",
    price: 15000,
    listingType: "HOLIDAY",
    propertyType: "HOUSE",
    bedrooms: 4,
    bathrooms: 3,
    county: "Kilifi",
    town: "Malindi",
    estate: "Casuarina",
    swimmingPool: true,
    furnished: true,
    security: true,
    isFeatured: false,
    isVerified: true,
    views: 403,
    publishedAt: "2026-07-26",
    primaryImage: {
      id: "prop-20-img",
      url: unsplash("photo-1582268611958-ebfd161ef9cf"),
      alt: "Malindi beach BnB",
      isPrimary: true,
      order: 0,
    },
  }),
  property({
    id: "prop-21",
    title: "Maasai Mara Safari Lodge Stay",
    slug: "maasai-mara-safari-bnb",
    price: 25000,
    listingType: "HOLIDAY",
    propertyType: "VILLA",
    bedrooms: 2,
    bathrooms: 2,
    county: "Narok",
    town: "Maasai Mara",
    estate: "Talek Gate",
    furnished: true,
    security: true,
    isFeatured: true,
    isPremium: true,
    isVerified: true,
    views: 1120,
    publishedAt: "2026-07-20",
    primaryImage: {
      id: "prop-21-img",
      url: unsplash("photo-1516426122078-c23e76319801"),
      alt: "Maasai Mara safari stay",
      isPrimary: true,
      order: 0,
    },
  }),
];

export const rentalProperties = mockProperties.filter(
  (p) => p.listingType === "RENT",
);

export const bnbProperties = mockProperties.filter(
  (p) => p.listingType === "HOLIDAY",
);

export const mockAgents: MockAgent[] = [
  {
    id: "agent-1",
    name: "Grace Wanjiku",
    slug: "grace-wanjiku",
    agency: "Savannah Realty",
    county: "Nairobi",
    rating: 4.9,
    reviewCount: 87,
    listingsCount: 42,
    image: unsplash("photo-1573496359142-b8d87734a5a2", 400),
    specialties: ["Luxury Homes", "Karen", "Runda"],
  },
  {
    id: "agent-2",
    name: "James Ochieng",
    slug: "james-ochieng",
    agency: "Coastline Properties",
    county: "Mombasa",
    rating: 4.8,
    reviewCount: 64,
    listingsCount: 38,
    image: unsplash("photo-1472099645785-5658abf4ff4e", 400),
    specialties: ["Beachfront", "Nyali", "Diani"],
  },
  {
    id: "agent-3",
    name: "Faith Akinyi",
    slug: "faith-akinyi",
    agency: "Lakeview Estates",
    county: "Kisumu",
    rating: 4.7,
    reviewCount: 51,
    listingsCount: 29,
    image: unsplash("photo-1580489944761-15a19d654956", 400),
    specialties: ["Apartments", "Commercial", "Land"],
  },
  {
    id: "agent-4",
    name: "Peter Kamau",
    slug: "peter-kamau",
    agency: "Highland Homes",
    county: "Kiambu",
    rating: 4.9,
    reviewCount: 73,
    listingsCount: 56,
    image: unsplash("photo-1507003211169-0a1dd7228f2d", 400),
    specialties: ["Maisonettes", "Plots", "Thika Road"],
  },
];

export const mockBlogPosts: BlogPostSummary[] = [
  {
    id: "blog-1",
    title: "Nairobi Property Market Outlook 2026",
    slug: "nairobi-property-market-outlook-2026",
    excerpt:
      "Key trends shaping home prices, rental yields, and buyer demand across Nairobi's top neighbourhoods.",
    coverImage: unsplash("photo-1600585154340-be6161a56a0c"),
    category: "Market Insights",
    tags: ["Nairobi", "Market", "2026"],
    published: true,
    publishedAt: "2026-07-20",
    views: 2340,
    author: { id: "author-1", name: "Sarah Mwangi", image: null },
  },
  {
    id: "blog-2",
    title: "First-Time Buyer's Guide to Kenyan Real Estate",
    slug: "first-time-buyers-guide-kenya",
    excerpt:
      "From title search to stamp duty — everything you need before signing on the dotted line.",
    coverImage: unsplash("photo-1560518883-ce09059eeffa"),
    category: "Guides",
    tags: ["Buyers", "Legal", "Finance"],
    published: true,
    publishedAt: "2026-07-10",
    views: 1890,
    author: { id: "author-2", name: "David Kiprop", image: null },
  },
  {
    id: "blog-3",
    title: "Why Kiambu Road Is Kenya's Fastest-Growing Corridor",
    slug: "kiambu-road-fastest-growing-corridor",
    excerpt:
      "Infrastructure upgrades and satellite towns are transforming commutes and property values along Kiambu Road.",
    coverImage: unsplash("photo-1449844908441-8829872d2607"),
    category: "Neighbourhoods",
    tags: ["Kiambu", "Investment", "Infrastructure"],
    published: true,
    publishedAt: "2026-06-28",
    views: 1567,
    author: { id: "author-1", name: "Sarah Mwangi", image: null },
  },
];

export const mockTestimonials: MockTestimonial[] = [
  {
    id: "test-1",
    name: "Mary Njeri",
    role: "Home Buyer",
    location: "Karen, Nairobi",
    quote:
      "NyumbaHub made finding our dream home effortless. Verified listings and responsive agents gave us confidence every step of the way.",
    rating: 5,
    avatar: unsplash("photo-1438761681033-6461ffad8d80", 200),
  },
  {
    id: "test-2",
    name: "Ahmed Hassan",
    role: "Property Investor",
    location: "Nyali, Mombasa",
    quote:
      "The search filters and neighbourhood insights helped me identify high-yield rentals along the coast. Best platform for Kenyan property.",
    rating: 5,
    avatar: unsplash("photo-1500648767791-00dcc994a43e", 200),
  },
  {
    id: "test-3",
    name: "Lucy Chebet",
    role: "Landlord",
    location: "Eldoret",
    quote:
      "Listing my apartments took minutes. I received quality leads within the first week and closed a tenant through M-Pesa deposit.",
    rating: 4,
    avatar: unsplash("photo-1544005313-94ddf0286df2", 200),
  },
];

export const mockLocations: MockLocation[] = [
  {
    name: "Nairobi",
    slug: "nairobi",
    county: "Nairobi",
    listingCount: 4280,
    image: unsplash("photo-1600585154340-be6161a56a0c"),
  },
  {
    name: "Mombasa",
    slug: "mombasa",
    county: "Mombasa",
    listingCount: 1890,
    image: unsplash("photo-1544551763-46a013bb70d5"),
  },
  {
    name: "Kisumu",
    slug: "kisumu",
    county: "Kisumu",
    listingCount: 742,
    image: unsplash("photo-1564013799919-ab600027ffc6"),
  },
  {
    name: "Nakuru",
    slug: "nakuru",
    county: "Nakuru",
    listingCount: 956,
    image: unsplash("photo-1500382017468-9049fed747ef"),
  },
  {
    name: "Kiambu",
    slug: "kiambu",
    county: "Kiambu",
    listingCount: 1340,
    image: unsplash("photo-1600607687939-ce8a6c25118c"),
  },
  {
    name: "Eldoret",
    slug: "eldoret",
    county: "Uasin Gishu",
    listingCount: 523,
    image: unsplash("photo-1564013799919-ab600027ffc6"),
  },
];

export const mockCategories: MockCategory[] = [
  {
    label: "Apartments",
    slug: "apartments",
    propertyType: "APARTMENT",
    listingCount: 3200,
    image: unsplash("photo-1502672260266-1c1ef2d93688", 600),
  },
  {
    label: "Houses & Villas",
    slug: "houses-villas",
    propertyType: "HOUSE",
    listingCount: 2100,
    image: unsplash("photo-1600596542815-ffad4c1539a9", 600),
  },
  {
    label: "Land & Plots",
    slug: "land-plots",
    propertyType: "PLOT",
    listingCount: 890,
    image: unsplash("photo-1500382017468-9049fed747ef", 600),
  },
  {
    label: "Commercial",
    slug: "commercial",
    propertyType: "OFFICE",
    listingCount: 640,
    image: unsplash("photo-1486406146926-c627a92ad1ab", 600),
  },
  {
    label: "BnB & Holiday",
    slug: "bnb",
    propertyType: "VILLA",
    listingCount: 320,
    image: unsplash("photo-1582268611958-ebfd161ef9cf", 600),
  },
  {
    label: "Maisonettes",
    slug: "maisonettes",
    propertyType: "MAISONETTE",
    listingCount: 780,
    image: unsplash("photo-1600607687939-ce8a6c25118c", 600),
  },
];

export const heroImageUrl = unsplash("photo-1600585154340-be6161a56a0c", 1920);

export const featuredProperties = mockProperties.filter((p) => p.isFeatured);
export const latestProperties = [...mockProperties]
  .sort(
    (a, b) =>
      new Date(b.publishedAt ?? 0).getTime() -
      new Date(a.publishedAt ?? 0).getTime(),
  )
  .slice(0, 8);

type MockSearchFilters = PropertySearchInput & {
  query?: string;
  isFeatured?: boolean;
  sortBy?: "newest" | "price_asc" | "price_desc" | "popular";
};

export function filterMockProperties(filters: MockSearchFilters) {
  let results = mockProperties.filter((p) => p.status === "ACTIVE");

  if (filters.query?.trim()) {
    const q = filters.query.trim().toLowerCase();
    results = results.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.town.toLowerCase().includes(q) ||
        p.county.toLowerCase().includes(q) ||
        (p.estate?.toLowerCase().includes(q) ?? false),
    );
  }
  if (filters.listingType) {
    results = results.filter((p) => p.listingType === filters.listingType);
  }
  if (filters.propertyType) {
    results = results.filter((p) => p.propertyType === filters.propertyType);
  }
  if (filters.county) {
    const county = filters.county.toLowerCase();
    results = results.filter((p) => p.county.toLowerCase().includes(county));
  }
  if (filters.town) {
    const town = filters.town.toLowerCase();
    results = results.filter((p) => p.town.toLowerCase().includes(town));
  }
  if (filters.minPrice != null) {
    results = results.filter((p) => p.price >= filters.minPrice!);
  }
  if (filters.maxPrice != null) {
    results = results.filter((p) => p.price <= filters.maxPrice!);
  }
  if (filters.bedrooms != null) {
    results = results.filter(
      (p) => p.bedrooms != null && p.bedrooms >= filters.bedrooms!,
    );
  }
  if (filters.bathrooms != null) {
    results = results.filter(
      (p) => p.bathrooms != null && p.bathrooms >= filters.bathrooms!,
    );
  }
  if (filters.furnished != null) {
    results = results.filter((p) => p.furnished === filters.furnished);
  }
  if (filters.swimmingPool != null) {
    results = results.filter((p) => p.swimmingPool === filters.swimmingPool);
  }
  if (filters.security != null) {
    results = results.filter((p) => p.security === filters.security);
  }
  if (filters.isFeatured) {
    results = results.filter((p) => p.isFeatured);
  }

  switch (filters.sortBy) {
    case "price_asc":
      results = [...results].sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      results = [...results].sort((a, b) => b.price - a.price);
      break;
    case "popular":
      results = [...results].sort((a, b) => b.views - a.views);
      break;
    case "newest":
    default:
      results = [...results].sort(
        (a, b) =>
          new Date(b.publishedAt ?? 0).getTime() -
          new Date(a.publishedAt ?? 0).getTime(),
      );
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const total = results.length;
  const skip = (page - 1) * limit;
  const data = results.slice(skip, skip + limit);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    data,
    total,
    page,
    limit,
    totalPages,
    hasMore: page < totalPages,
  };
}

export function getMockPropertyBySlug(slug: string): PropertyCard | undefined {
  return mockProperties.find((p) => p.slug === slug);
}

export const mockLeads = [
  {
    id: "lead-1",
    propertyId: "prop-1",
    propertyTitle: "Modern 3BR Apartment in Kilimani",
    name: "Peter Kamau",
    email: "peter.k@example.com",
    phone: "0712345678",
    message: "Interested in viewing this Saturday morning.",
    status: "NEW" as const,
    createdAt: "2026-02-28T10:30:00.000Z",
  },
  {
    id: "lead-2",
    propertyId: "prop-3",
    propertyTitle: "Furnished 2BR in Westlands",
    name: "Sarah Njeri",
    email: "sarah.n@example.com",
    phone: "0723456789",
    message: "Corporate lease for 12 months. Can we negotiate?",
    status: "CONTACTED" as const,
    createdAt: "2026-02-25T14:00:00.000Z",
  },
];

export const mockSellerStats = {
  totalListings: 8,
  activeListings: 5,
  pendingListings: 2,
  totalViews: 4520,
  totalLeads: 14,
  newLeads: 3,
  conversionRate: 12.5,
  featuredListings: 2,
  premiumListings: 1,
};

export const mockAgentStats = {
  ...mockSellerStats,
  totalClients: 18,
  scheduledViewings: 4,
  averageRating: 4.8,
  reviewCount: 47,
};
