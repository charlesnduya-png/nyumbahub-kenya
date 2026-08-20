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
  getNearbyPlaces,
  getPropertyForSalePlace,
  propertyForSalePath,
  salePlaceFaqs,
  type PropertyForSalePlace,
} from "@/lib/property-for-sale";
import { formatPrice } from "@/lib/utils";
import type { PropertyCard } from "@/types";

export function PropertyForSaleLocationPage({
  place,
  listings,
  total,
  minPrice,
  maxPrice,
}: {
  place: PropertyForSalePlace;
  listings: PropertyCard[];
  total: number;
  minPrice: number | null;
  maxPrice: number | null;
}) {
  const faqs = salePlaceFaqs(place);
  const nearby = getNearbyPlaces(place);
  const locationLabel =
    place.kind === "town" ? `${place.name}, ${place.county}` : place.name;
  const rentHref =
    place.kind === "town"
      ? `/properties?listingType=RENT&town=${encodeURIComponent(place.name)}`
      : `/properties?listingType=RENT&county=${encodeURIComponent(place.county)}`;
  const landHref = `/properties?category=land-plots&county=${encodeURIComponent(place.county)}`;
  const priceRange =
    minPrice != null && maxPrice != null && total > 0
      ? `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`
      : null;

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
            <Link href="/property-for-sale" className="hover:text-primary">
              Property for sale
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
            {place.region} · {place.kind === "town" ? place.county : "County"}
          </Badge>
          <h1 className="font-display max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Property for sale in {place.name}
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
                View homes & land
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={rentHref}>Rentals in {place.name}</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register/professional">List a property</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-semibold">
          Why buyers look at {locationLabel}
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
              Houses & land for sale in {place.name}
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Verified listings with photos and KES prices. Contact the seller
              or agent from the listing page.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link
              href={`/properties?listingType=BUY&county=${encodeURIComponent(place.county)}`}
            >
              Open full search
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {listings.length === 0 ? (
          <div className="mt-8 rounded-3xl border bg-card/80 p-8 text-center">
            <p className="font-medium">
              No live sale listings in {place.name} right now.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Check nearby counties or browse all Kenya property for sale. New
              homes go live after admin approval.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href="/property-for-sale">All counties</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/properties?listingType=BUY">Search Kenya</Link>
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
          Buying property in {place.name}
        </h2>
        <p className="mt-4 max-w-3xl text-muted-foreground leading-relaxed">
          {place.buyingGuide}
        </p>
        <p className="mt-4 max-w-3xl text-muted-foreground leading-relaxed">
          Your Home is Kenya&apos;s marketplace for verified homes and land.
          We do not replace your advocate, surveyor, or a physical inspection.
          Use the listing to compare price, photos, and location, then complete
          due diligence before you pay.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href={landHref}>Land & plots in {place.county}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/blog">Buying guides</Link>
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
                        ? propertyForSalePath(townPlace.slug)
                        : `/properties?listingType=BUY&town=${encodeURIComponent(town)}`
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
            Nearby places for sale
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {nearby.map((item) => (
              <Button key={item.slug} variant="secondary" size="sm" asChild>
                <Link href={propertyForSalePath(item.slug)}>
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
            {place.name} property questions
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
