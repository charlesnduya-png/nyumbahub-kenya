import Link from "next/link";
import { ArrowRight, CheckCircle2, MapPin, Search } from "lucide-react";

import { PropertyCardComponent } from "@/components/property/property-card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  intentFaqs,
  intentHeading,
  intentHubPath,
  intentPlacePath,
  propertiesSearchHref,
  type LocationMarketIntent,
} from "@/lib/location-seo";
import {
  getNearbyPlaces,
  getPropertyForSalePlace,
  placeLocationLabel,
  type PropertyForSalePlace,
} from "@/lib/property-for-sale";
import { formatPrice } from "@/lib/utils";
import type { PropertyCard } from "@/types";

const INTENT_LABEL: Record<LocationMarketIntent, string> = {
  sale: "For sale",
  rent: "For rent",
  bnb: "BnB · Short stays",
};

const LISTINGS_COPY: Record<
  LocationMarketIntent,
  { title: string; subtitle: string; empty: string; searchAll: string }
> = {
  sale: {
    title: "Houses & land for sale",
    subtitle:
      "Verified listings with photos and local prices. Contact the seller or agent from the listing page.",
    empty: "No live sale listings here right now.",
    searchAll: "Search all for sale",
  },
  rent: {
    title: "Homes for rent",
    subtitle:
      "Monthly rentals with photos. Message the landlord or agent from the listing.",
    empty: "No live rentals here right now.",
    searchAll: "Search all rentals",
  },
  bnb: {
    title: "BnB & holiday stays",
    subtitle:
      "Short stays priced per night. Book dates and the host confirms from their dashboard.",
    empty: "No live BnB stays here right now.",
    searchAll: "Search all BnBs",
  },
};

export function LocationMarketPage({
  place,
  intent = "sale",
  listings,
  total,
  minPrice,
  maxPrice,
}: {
  place: PropertyForSalePlace;
  intent?: LocationMarketIntent;
  listings: PropertyCard[];
  total: number;
  minPrice: number | null;
  maxPrice: number | null;
}) {
  const faqs = intentFaqs(intent, place);
  const nearby = getNearbyPlaces(place);
  const locationLabel = placeLocationLabel(place);
  const copy = LISTINGS_COPY[intent];
  const searchHref = propertiesSearchHref(intent, place);
  const hubPath = intentHubPath(intent);
  const regionBadge =
    place.kind === "country"
      ? place.region
      : place.kind === "city"
        ? `${place.country} · ${place.region}`
        : `${place.region} · ${place.kind === "town" ? place.county : "County"}`;
  const priceRange =
    minPrice != null && maxPrice != null && total > 0
      ? `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`
      : null;
  const otherIntents = (
    [
      ["sale", "Buy"],
      ["rent", "Rent"],
      ["bnb", "BnB"],
    ] as const
  ).filter(([key]) => key !== intent);

  return (
    <div className="gradient-mesh">
      <nav
        aria-label="Breadcrumb"
        className="border-b bg-background/80 text-sm text-muted-foreground"
      >
        <ol className="mx-auto flex max-w-7xl flex-wrap gap-1 px-4 py-3 sm:px-6 lg:px-8">
          <li>
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={hubPath} className="hover:text-primary">
              {INTENT_LABEL[intent]}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground">{place.name}</li>
        </ol>
      </nav>

      <section className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <Badge className="mb-4 gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {regionBadge}
          </Badge>
          <h1 className="font-display max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
            {intentHeading(intent, place)}
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
            {place.intro}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span>
              {total} verified listing{total === 1 ? "" : "s"}
            </span>
            {priceRange ? <span>· Asking prices {priceRange}</span> : null}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="#listings">
                <Search className="mr-2 h-4 w-4" />
                View listings
              </Link>
            </Button>
            {otherIntents.map(([key, label]) => (
              <Button key={key} size="lg" variant="outline" asChild>
                <Link href={intentPlacePath(key, place.slug)}>
                  {label} in {place.name}
                </Link>
              </Button>
            ))}
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register/professional">List a property</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-semibold">
          Why people search {locationLabel}
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {place.highlights.map((item) => (
            <li
              key={item}
              className="rounded-2xl border bg-card/80 p-5 text-sm leading-relaxed"
            >
              <CheckCircle2 className="mb-3 h-5 w-5 text-primary" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section
        id="listings"
        className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-4 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              {copy.title} in {place.name}
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {copy.subtitle}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href={searchHref}>
              Open full search
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {listings.length === 0 ? (
          <div className="mt-8 rounded-3xl border bg-card/80 p-8 text-center">
            <p className="font-medium">{copy.empty}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Check nearby places or browse all African listings. New homes go
              live after admin approval.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href={hubPath}>{copy.searchAll}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/africa">All African countries</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((property, index) => (
              <PropertyCardComponent
                key={property.id}
                property={property}
                priority={index < 4}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-semibold">
          {intent === "bnb"
            ? `Staying in ${place.name}`
            : intent === "rent"
              ? `Renting in ${place.name}`
              : `Buying property in ${place.name}`}
        </h2>
        <p className="mt-4 max-w-3xl text-muted-foreground leading-relaxed">
          {place.buyingGuide}
        </p>
        <p className="mt-4 max-w-3xl text-muted-foreground leading-relaxed">
          Your Home is Africa&apos;s marketplace for verified homes, land,
          rentals, and BnB stays — with Kenya as our home market. We do not
          replace your advocate, surveyor, or a physical inspection. Compare
          price, photos, and location, then complete due diligence before you
          pay.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link
              href={
                place.kind === "country" || place.kind === "city"
                  ? `/properties?category=land-plots&country=${encodeURIComponent(place.country)}`
                  : `/properties?category=land-plots&county=${encodeURIComponent(String(place.county))}`
              }
            >
              Land & plots
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/blog">Guides</Link>
          </Button>
        </div>
      </section>

      {place.towns.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <h2 className="font-display text-xl font-semibold">
            Popular areas in {place.name}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {place.towns.map((town) => {
              const townPlace = getPropertyForSalePlace(
                town
                  .toLowerCase()
                  .replace(/'/g, "")
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, ""),
              );
              return (
                <Button key={town} variant="outline" size="sm" asChild>
                  <Link
                    href={
                      townPlace
                        ? intentPlacePath(intent, townPlace.slug)
                        : `/properties?town=${encodeURIComponent(town)}`
                    }
                  >
                    {town}
                  </Link>
                </Button>
              );
            })}
          </div>
        </section>
      ) : null}

      {nearby.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <h2 className="font-display text-xl font-semibold">
            Nearby {intent === "bnb" ? "stays" : "places"}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {nearby.map((item) => (
              <Button key={item.slug} variant="secondary" size="sm" asChild>
                <Link href={intentPlacePath(intent, item.slug)}>
                  {item.name}
                </Link>
              </Button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="border-t bg-card/50 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-center text-3xl font-semibold tracking-tight">
            {place.name} {INTENT_LABEL[intent].toLowerCase()} questions
          </h2>
          <Accordion type="single" collapsible className="mt-8 w-full">
            {faqs.map((item, index) => (
              <AccordionItem key={item.question} value={`faq-${index}`}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}

export function PropertyForSaleLocationPage(
  props: Omit<Parameters<typeof LocationMarketPage>[0], "intent">,
) {
  return <LocationMarketPage {...props} intent="sale" />;
}
