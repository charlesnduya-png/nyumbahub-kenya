import type { Metadata } from "next";
import { formatPrice } from "@/lib/utils";

const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME?.trim() || "NyumbaHub Kenya";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  process.env.AUTH_URL?.trim() ||
  "http://localhost:3000";

export { APP_NAME, APP_URL };

export function absoluteUrl(path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, APP_URL).toString();
}

export interface PropertyMetadataInput {
  title: string;
  description: string;
  slug: string;
  price: number;
  currency?: string;
  county: string;
  town: string;
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

function truncateDescription(text: string, maxLength = 160): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  return `${cleaned.slice(0, maxLength - 1).trimEnd()}…`;
}

export function generatePropertyMetadata(
  property: PropertyMetadataInput,
): Metadata {
  const location = [property.estate, property.town, property.county]
    .filter(Boolean)
    .join(", ");
  const priceLabel = formatPrice(property.price, {
    currency: property.currency ?? "KES",
  });
  const title = `${property.title} | ${priceLabel} | ${APP_NAME}`;
  const description = truncateDescription(
    property.description ||
      `${property.listingType} ${property.propertyType} in ${location}. ${priceLabel}.`,
  );
  const url = absoluteUrl(`/properties/${property.slug}`);
  const image = property.imageUrl ?? absoluteUrl("/og-default.jpg");

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "en_KE",
      url,
      siteName: APP_NAME,
      title: property.title,
      description,
      images: [{ url: image, alt: property.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: property.title,
      description,
      images: [image],
    },
    keywords: [
      property.propertyType,
      property.listingType,
      property.county,
      property.town,
      "Kenya real estate",
      "property",
      APP_NAME,
    ],
  };
}

export function generateBlogMetadata(post: BlogMetadataInput): Metadata {
  const title = `${post.title} | ${APP_NAME}`;
  const description = truncateDescription(
    post.excerpt ?? `Read ${post.title} on ${APP_NAME}.`,
  );
  const url = absoluteUrl(`/blog/${post.slug}`);
  const image = post.coverImage ?? absoluteUrl("/og-default.jpg");

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
    keywords: [post.category, "Kenya property", "real estate blog", APP_NAME],
  };
}

export interface PropertyJsonLdInput extends PropertyMetadataInput {
  id: string;
  status?: string;
  floorArea?: number | null;
  images?: string[];
}

export function propertyJsonLd(property: PropertyJsonLdInput): object {
  const location = [property.estate, property.town, property.county]
    .filter(Boolean)
    .join(", ");
  const url = absoluteUrl(`/properties/${property.slug}`);
  const images =
    property.images && property.images.length > 0
      ? property.images
      : property.imageUrl
        ? [property.imageUrl]
        : [absoluteUrl("/og-default.jpg")];

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
      addressCountry: "KE",
      ...(property.estate ? { streetAddress: property.estate } : {}),
    },
    geo: undefined,
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
          ? [{ "@type": "PropertyValue", name: "bedrooms", value: property.bedrooms }]
          : []),
        ...(property.bathrooms != null
          ? [{ "@type": "PropertyValue", name: "bathrooms", value: property.bathrooms }]
          : []),
        ...(property.floorArea != null
          ? [{ "@type": "PropertyValue", name: "floorArea", value: property.floorArea }]
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
