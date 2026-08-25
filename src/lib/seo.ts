import type { Metadata } from "next";
import { iso2ForCountry } from "@/lib/african-countries";
import { formatPrice } from "@/lib/utils";

const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Your Home";

function resolvePublicAppUrl() {
  const raw = (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    "https://yourhome.co.ke"
  ).replace(/\/$/, "");

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    if (host === "yourhome.co.ke") {
      return "https://yourhome.co.ke";
    }
    return `${parsed.protocol}//${parsed.host}`.replace(/\/$/, "");
  } catch {
    return "https://yourhome.co.ke";
  }
}

const APP_URL = resolvePublicAppUrl();
const GOOGLE_SITE_VERIFICATION =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() ||
  process.env.GOOGLE_SITE_VERIFICATION?.trim() ||
  "";

const APP_DESCRIPTION =
  "Your Home (yourhome.co.ke) — Africa's marketplace for verified houses, apartments, land, plots, rentals, and BnB stays. Search Kenya, Nigeria, Ghana, South Africa, Tanzania, Uganda, Egypt, Morocco, Rwanda, and all 54 African countries. List free. M-Pesa ready.";

/** Core + long-tail Africa real estate keywords for metadata. */
const SEO_KEYWORDS = [
  "Your Home Kenya",
  "yourhome.co.ke",
  "Africa real estate",
  "best real estate Africa",
  "property for sale Africa",
  "houses for rent Africa",
  "BnB Africa",
  "Airbnb Africa",
  "Kenya real estate",
  "property Kenya",
  "nyumba za kuuza Kenya",
  "nyumba za kukodi Nairobi",
  "houses for sale Kenya",
  "houses for rent Nairobi",
  "apartments for rent Kenya",
  "Lagos property for sale",
  "Accra apartments for rent",
  "Cape Town BnB",
  "Johannesburg houses for sale",
  "Kampala rentals",
  "Dar es Salaam property",
  "Kigali real estate",
  "Cairo apartments",
  "Casablanca property",
  "Abidjan houses",
  "Addis Ababa real estate",
  "land for sale Kenya",
  "plots for sale Nairobi",
  "commercial property Africa",
  "holiday homes Africa",
  "real estate agents Kenya",
  "verified property listings Africa",
  "list property free Kenya",
  "M-Pesa property listing",
];

export {
  APP_NAME,
  APP_URL,
  APP_DESCRIPTION,
  SEO_KEYWORDS,
  GOOGLE_SITE_VERIFICATION,
};

export function absoluteUrl(path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath === "/") {
    return `${APP_URL}/`;
  }
  return new URL(normalizedPath, `${APP_URL}/`).toString();
}

export function truncateDescription(text: string, maxLength = 160): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  return `${cleaned.slice(0, maxLength - 1).trimEnd()}…`;
}

export function buildPageMetadata(input: {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  keywords?: string[];
  noIndex?: boolean;
}): Metadata {
  const url = absoluteUrl(input.path ?? "/");
  const image = input.image ?? absoluteUrl("/opengraph-image");
  const fullTitle = input.title.includes(APP_NAME)
    ? input.title
    : `${input.title} | ${APP_NAME}`;
  const pageKeywords = input.keywords ?? [];
  const keywords = [
    ...pageKeywords,
    ...SEO_KEYWORDS.filter((k) => !pageKeywords.includes(k)).slice(0, 12),
  ];

  return {
    title: input.title,
    description: truncateDescription(input.description),
    keywords,
    alternates: {
      canonical: url,
    },
    robots: input.noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: "website",
      locale: "en_KE",
      alternateLocale: [
        "en_NG",
        "en_GH",
        "en_ZA",
        "en_UG",
        "en_TZ",
        "en_RW",
        "en_EG",
        "fr_CI",
        "fr_SN",
      ],
      url,
      siteName: APP_NAME,
      title: fullTitle,
      description: truncateDescription(input.description),
      images: [{ url: image, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: truncateDescription(input.description),
      images: [image],
    },
  };
}

/** Dynamic metadata for /properties with filters (county, town, category, etc.). */
export function buildPropertiesSearchMetadata(
  params: Record<string, string | string[] | undefined>,
): Metadata {
  const str = (key: string) => {
    const v = params[key];
    return typeof v === "string" ? v.trim() : undefined;
  };

  const category = str("category");
  const listingType = str("listingType");
  const propertyType = str("propertyType");
  const county = str("county");
  const town = str("town");
  const agentId = str("agentId");

  const country = str("country");
  const location = [town, county, country].filter(Boolean).join(", ");
  const locationSuffix = location ? ` in ${location}` : " across Africa";

  let title = "Properties for Sale & Rent in Africa";
  let description =
    "Search verified houses, apartments, land, commercial space, and holiday homes across Africa — Kenya, Nigeria, Ghana, South Africa, and all 54 countries. Filter by city, price, and bedrooms on Your Home.";
  const keywords: string[] = [
    "property Africa",
    "real estate Africa",
    "verified listings Africa",
    "Kenya real estate",
  ];
  const pathParts = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.trim()) {
      pathParts.set(key, value.trim());
    }
  }
  const path = pathParts.toString()
    ? `/properties?${pathParts.toString()}`
    : "/properties";

  if (agentId) {
    title = "Agent property listings";
    description =
      "Browse active homes and land listed by this verified agent on Your Home Kenya.";
  } else if (category === "land-plots") {
    title = `Land & Plots for Sale${locationSuffix}`;
    description = `Find verified vacant land, plots, and farms${locationSuffix}. Compare prices and contact sellers on Your Home — Africa's property marketplace.`;
    keywords.push(
      "land for sale Kenya",
      "plots for sale Nairobi",
      "agricultural land Kenya",
      "title deed land Kenya",
    );
  } else if (category === "commercial") {
    title = `Commercial Property${locationSuffix}`;
    description = `Offices, shops, and warehouses for sale and rent${locationSuffix}. Verified commercial listings on Your Home.`;
    keywords.push(
      "commercial property Kenya",
      "office space Nairobi",
      "shop for rent Kenya",
    );
  } else if (listingType === "RENT") {
    title = `Houses & Apartments for Rent${locationSuffix}`;
    description = `Browse monthly rentals — bedsitters, apartments, maisonettes, and family homes${locationSuffix}. Verified landlords on Your Home.`;
    keywords.push(
      "houses for rent Nairobi",
      "apartments for rent Kenya",
      "rentals Kenya",
    );
  } else if (listingType === "BUY") {
    title = `Houses & Property for Sale${locationSuffix}`;
    description = `Homes, apartments, and townhouses for sale${locationSuffix}. Verified sellers and agents on Your Home.`;
    keywords.push("houses for sale Kenya", "property for sale Nairobi");
  } else if (listingType === "HOLIDAY") {
    title = `BnB & Holiday Stays${locationSuffix}`;
    description = `Short-stay apartments, beach villas, and city Airbnbs${locationSuffix}. Book on Your Home.`;
    keywords.push("BnB Kenya", "Airbnb Kenya", "holiday homes Kenya");
  } else if (listingType === "HOTEL") {
    title = `Hotels${locationSuffix}`;
    description = `Book hotels and lodges${locationSuffix}. Prices per night, with member savings when you sign in.`;
    keywords.push("hotels Kenya", "hotels Africa", "book hotel Nairobi");
  } else if (propertyType === "APARTMENT") {
    title = `Apartments${locationSuffix}`;
    description = `Flats and apartments for sale and rent${locationSuffix} on Your Home — Africa real estate you can trust.`;
    keywords.push("apartments Kenya", "flats Nairobi");
  } else if (propertyType === "HOUSE" || propertyType === "VILLA") {
    title = `Houses & Villas${locationSuffix}`;
    description = `Standalone houses, bungalows, and villas${locationSuffix}. Browse verified listings on Your Home.`;
    keywords.push("houses Kenya", "villas for sale Kenya");
  } else if (county) {
    title = `Property in ${county}${country ? `, ${country}` : ""}`;
    description = `Homes, land, and rentals in ${county}${country ? `, ${country}` : ""}. Search verified listings on Your Home.`;
    keywords.push(`${county} property`, `${county} real estate`);
  } else if (country) {
    title = `Property in ${country}`;
    description = `Homes, land, rentals, and BnB stays in ${country}. Search verified listings on Your Home.`;
    keywords.push(`${country} property`, `${country} real estate`, `${country} BnB`);
  }

  if (town) {
    keywords.push(`${town} property`, `${town} houses`, `${town} rentals`, `${town} BnB`);
  }
  if (country) {
    keywords.push(`${country} houses for sale`, `${country} apartments for rent`);
  }

  return buildPageMetadata({ title, description, path, keywords });
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "RealEstateAgent"],
    "@id": `${APP_URL}/#organization`,
    name: APP_NAME,
    alternateName: ["Your Home Kenya", "yourhome.co.ke", "YourHome Kenya"],
    url: absoluteUrl("/"),
    logo: absoluteUrl("/opengraph-image"),
    image: absoluteUrl("/opengraph-image"),
    description: APP_DESCRIPTION,
    foundingDate: "2026",
    areaServed: [
      { "@type": "Continent", name: "Africa" },
      { "@type": "Country", name: "Kenya" },
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "KE",
      addressLocality: "Nairobi",
      addressRegion: "Nairobi",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: ["English", "Swahili", "French"],
      email: "charlesnduya84@gmail.com",
      areaServed: ["AF", "KE"],
    },
    knowsAbout: [
      "Africa real estate",
      "Kenya real estate",
      "property sales",
      "rentals",
      "land and plots",
      "BnB stays",
      "Airbnb-style holiday homes",
      "commercial property",
    ],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${APP_URL}/#website`,
    name: APP_NAME,
    alternateName: "yourhome.co.ke",
    url: absoluteUrl("/"),
    description: APP_DESCRIPTION,
    inLanguage: ["en-KE", "en"],
    publisher: { "@id": `${APP_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${APP_URL}/properties?town={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function homeFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export const HOME_FAQ_ITEMS = [
  {
    question: "Where can I find houses for sale in Africa?",
    answer:
      "Browse verified houses, apartments, and land for sale across all 54 African countries on Your Home (yourhome.co.ke). Search Kenya, Nigeria, Ghana, South Africa, Tanzania, Uganda, Egypt, Morocco, Rwanda, and more.",
  },
  {
    question: "How do I rent an apartment in Nairobi, Lagos, or Accra?",
    answer:
      "Use Your Home to search monthly rentals in major African cities. Filter by price and bedrooms, then contact verified landlords and agents.",
  },
  {
    question: "Does Your Home list BnB and Airbnb stays?",
    answer:
      "Yes. Book short-stay apartments, beach villas, and holiday homes across Africa — from Diani and Zanzibar to Cape Town, Marrakech, and Lagos.",
  },
  {
    question: "Can I book a hotel on Your Home?",
    answer:
      "Yes. Browse Hotels for city hotels, lodges, and serviced rooms priced per night. Sign in for member savings, pick dates, and the host confirms your stay.",
  },
  {
    question: "Can I list my property for free?",
    answer:
      "Yes. Landlords, agents, and sellers can register on Your Home and list properties in any African country. Listings are reviewed for quality before going live.",
  },
] as const;

export function itemListJsonLd(
  name: string,
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(item.path),
      name: item.name,
    })),
  };
}

export function faqPageJsonLd(
  items: Array<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export interface PropertyMetadataInput {
  title: string;
  description: string;
  slug: string;
  price: number;
  currency?: string;
  county: string;
  town: string;
  country?: string | null;
  estate?: string | null;
  listingType: string;
  propertyType: string;
  imageUrl?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  publishedAt?: Date | string | null;
}

export interface BlogMetadataInput {
  title: string;
  excerpt?: string | null;
  slug: string;
  coverImage?: string | null;
  category: string;
  publishedAt?: Date | string | null;
  authorName?: string | null;
}

export function generatePropertyMetadata(
  property: PropertyMetadataInput,
): Metadata {
  const countryName = property.country?.trim() || "Kenya";
  const location = [property.estate, property.town, property.county, countryName]
    .filter(Boolean)
    .join(", ");
  const priceLabel = formatPrice(property.price, {
    currency: property.currency ?? "KES",
  });
  const listingLabel =
    property.listingType === "RENT"
      ? "for rent"
      : property.listingType === "HOLIDAY"
        ? "BnB / holiday"
        : property.listingType === "HOTEL"
          ? "hotel stay"
          : property.listingType === "LAND"
          ? "land for sale"
          : property.listingType === "COMMERCIAL"
            ? "commercial"
            : "for sale";
  const typeLabel = property.propertyType.replace(/_/g, " ").toLowerCase();
  const title = `${property.title} — ${typeLabel} ${listingLabel} in ${property.town}, ${countryName}`;
  const description = truncateDescription(
    property.description ||
      `${typeLabel} ${listingLabel} in ${location}. ${priceLabel}. Verified listing on Your Home (yourhome.co.ke).`,
  );
  const url = absoluteUrl(`/properties/${property.slug}`);
  const image = property.imageUrl ?? absoluteUrl("/opengraph-image");

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "en_KE",
      url,
      siteName: APP_NAME,
      title: `${property.title} | ${priceLabel}`,
      description,
      images: [{ url: image, alt: property.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${property.title} | ${priceLabel}`,
      description,
      images: [image],
    },
    keywords: [
      property.title,
      `${property.town} ${typeLabel}`,
      `${property.town} property ${listingLabel}`,
      `${property.county} real estate`,
      `${countryName} real estate`,
      `${property.town} ${countryName}`,
      property.listingType,
      property.propertyType,
      "Africa property",
      "yourhome.co.ke",
      APP_NAME,
    ],
  };
}

export function generateAgentMetadata(input: {
  name: string;
  agencyName?: string | null;
  county?: string | null;
  town?: string | null;
  id: string;
  image?: string | null;
}): Metadata {
  const location = [input.town, input.county].filter(Boolean).join(", ");
  const title = location
    ? `${input.name} — Real Estate Agent in ${location}`
    : `${input.name} — Real Estate Agent Africa`;
  const description = truncateDescription(
    `${input.name}${input.agencyName ? ` at ${input.agencyName}` : ""} — verified estate agent on Your Home. Browse active property listings${location ? ` in ${location}` : " across Africa"}.`,
  );

  return buildPageMetadata({
    title,
    description,
    path: `/agents/${input.id}`,
    image: input.image,
    keywords: [
      `${input.name} agent`,
      "real estate agent Kenya",
      "real estate agent Africa",
      input.county ? `${input.county} estate agent` : "Nairobi estate agent",
      "property agent Kenya",
      "yourhome.co.ke agents",
    ],
  });
}

export function generateBlogMetadata(post: BlogMetadataInput): Metadata {
  const title = post.title;
  const description = truncateDescription(
    post.excerpt ??
      `Africa property guide: ${post.title}. Market tips, buying, renting, and investing on ${APP_NAME}.`,
  );
  const url = absoluteUrl(`/blog/${post.slug}`);
  const image = post.coverImage ?? absoluteUrl("/opengraph-image");

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      locale: "en_KE",
      url,
      siteName: APP_NAME,
      title: post.title,
      description,
      images: [{ url: image, alt: post.title }],
      ...(post.publishedAt
        ? { publishedTime: new Date(post.publishedAt).toISOString() }
        : {}),
      ...(post.authorName ? { authors: [post.authorName] } : {}),
      section: post.category,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [image],
    },
    keywords: [
      post.category,
      "Africa property blog",
      "real estate tips Africa",
      "housing market Africa",
      "buy property Africa",
      "yourhome.co.ke",
      APP_NAME,
    ],
  };
}

export interface PropertyJsonLdInput extends PropertyMetadataInput {
  id: string;
  status?: string;
  floorArea?: number | null;
  images?: string[];
}

export function propertyJsonLd(property: PropertyJsonLdInput): object {
  const countryName = property.country?.trim() || "Kenya";
  const location = [property.estate, property.town, property.county, countryName]
    .filter(Boolean)
    .join(", ");
  const url = absoluteUrl(`/properties/${property.slug}`);
  const images =
    property.images && property.images.length > 0
      ? property.images
      : property.imageUrl
        ? [property.imageUrl]
        : [absoluteUrl("/opengraph-image")];

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: truncateDescription(property.description, 500),
    url,
    datePosted: property.publishedAt
      ? new Date(property.publishedAt).toISOString()
      : undefined,
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: property.currency ?? "KES",
      availability:
        property.status === "ACTIVE"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: property.town,
      addressRegion: property.county,
      addressCountry: iso2ForCountry(countryName).toUpperCase(),
      ...(property.estate ? { streetAddress: property.estate } : {}),
    },
    image: images,
    mainEntity: {
      "@type": "Product",
      name: property.title,
      description: truncateDescription(property.description, 500),
      category: property.propertyType,
      image: images,
      offers: {
        "@type": "Offer",
        price: property.price,
        priceCurrency: property.currency ?? "KES",
        url,
      },
      additionalProperty: [
        ...(property.bedrooms != null
          ? [
              {
                "@type": "PropertyValue",
                name: "bedrooms",
                value: property.bedrooms,
              },
            ]
          : []),
        ...(property.bathrooms != null
          ? [
              {
                "@type": "PropertyValue",
                name: "bathrooms",
                value: property.bathrooms,
              },
            ]
          : []),
        ...(property.floorArea != null
          ? [
              {
                "@type": "PropertyValue",
                name: "floorArea",
                value: property.floorArea,
              },
            ]
          : []),
        {
          "@type": "PropertyValue",
          name: "listingType",
          value: property.listingType,
        },
        {
          "@type": "PropertyValue",
          name: "location",
          value: location,
        },
      ],
    },
  };
}
