import Link from "next/link";
import { MapPin, Search } from "lucide-react";

import { FeaturedProperties } from "@/components/home/featured-properties";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getForSaleCountsByCounty,
  getListingCountsByCountry,
  searchForSaleByLocation,
} from "@/lib/properties";
import {
  getPlacesByRegion,
  getAfricaPlacesByRegion,
  propertyForSalePath,
} from "@/lib/property-for-sale";
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  faqPageJsonLd,
  itemListJsonLd,
} from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Property for Sale in Africa — Houses, Apartments & Land",
  description:
    "Browse verified property for sale across Africa and all 47 Kenyan counties. Houses, apartments, and land in Nairobi, Lagos, Accra, Cape Town, Kampala, Kigali, and every African country. Compare prices on Your Home.",
  path: "/property-for-sale",
  keywords: [
    "property for sale Africa",
    "houses for sale Nairobi",
    "houses for sale Lagos",
    "houses for sale Accra",
    "land for sale Kenya",
    "property for sale Cape Town",
    "best real estate Africa",
  ],
});

export const revalidate = 3600;

const INDEX_FAQS = [
  {
    question: "Where can I find property for sale in Africa?",
    answer:
      "Your Home lists verified houses, apartments, and land for sale in all 54 African countries, including every Kenyan county. Open a country page such as Nigeria or Ghana, or a Kenya county such as Nairobi or Mombasa.",
  },
  {
    question: "Does property for sale include land?",
    answer:
      "Yes. Each location page shows homes listed for sale and land/plots. You can also open Land & plots if you only want vacant land.",
  },
  {
    question: "How do listings get on Your Home?",
    answer:
      "Sellers and agents open a professional account, submit the property, and go live after Your Home admin approval. Buyers contact them from the listing.",
  },
];

export default async function PropertyForSaleIndexPage() {
  const [latest, counts, countryCounts] = await Promise.all([
    searchForSaleByLocation({ limit: 12 }),
    getForSaleCountsByCounty(),
    getListingCountsByCountry(),
  ]);
  const groups = getPlacesByRegion();
  const africaGroups = getAfricaPlacesByRegion();
  const countyLinks = [
    ...groups.flatMap((group) =>
      group.places.map((place) => ({
        name: `Property for sale in ${place.name}`,
        path: propertyForSalePath(place.slug),
      })),
    ),
    ...africaGroups.flatMap((group) =>
      group.places.map((place) => ({
        name: `Property for sale in ${place.name}`,
        path: propertyForSalePath(place.slug),
      })),
    ),
  ];

  return (
    <div className="gradient-mesh">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Property for sale", path: "/property-for-sale" },
            ]),
            itemListJsonLd("Property for sale across Africa", countyLinks),
            faqPageJsonLd(INDEX_FAQS),
          ]),
        }}
      />

      <section className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <Badge className="mb-4 gap-1">
            <MapPin className="h-3.5 w-3.5" />
            Kenya · 54 African countries
          </Badge>
          <h1 className="font-display max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Property for sale in Africa
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Verified houses, apartments, and land for sale — from Nairobi,
            Lagos, Accra, and Cape Town to Kampala, Kigali, Cairo, and every
            African country. Open a place to see local listings.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/properties?listingType=BUY">
                <Search className="mr-2 h-4 w-4" />
                Search all for-sale listings
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/property-for-sale/nairobi">Nairobi</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/property-for-sale/lagos">Lagos</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/africa">All countries</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register/professional">List a property</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="font-display mb-8 text-2xl font-semibold">Kenya counties</h2>
        {groups.map((group) => (
          <div key={group.region} className="mb-12 last:mb-0">
            <h3 className="font-display text-xl font-semibold">
              {group.region}
            </h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.places.map((place) => {
                const count = counts[place.name.toLowerCase()] ?? 0;
                return (
                  <li key={place.slug}>
                    <Link
                      href={propertyForSalePath(place.slug)}
                      className="flex items-center justify-between rounded-2xl border bg-card/80 px-4 py-3 text-sm transition-colors hover:border-primary hover:text-primary"
                    >
                      <span className="font-medium">{place.name}</span>
                      <span className="text-muted-foreground">
                        {count > 0 ? `${count}` : "View"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        {africaGroups.map((group) => (
          <div key={group.region} className="mb-12 last:mb-0">
            <h2 className="font-display text-2xl font-semibold">
              {group.region}
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.places.map((place) => {
                const count = countryCounts[place.name.toLowerCase()] ?? 0;
                return (
                  <li key={place.slug}>
                    <Link
                      href={propertyForSalePath(place.slug)}
                      className="flex items-center justify-between rounded-2xl border bg-card/80 px-4 py-3 text-sm transition-colors hover:border-primary hover:text-primary"
                    >
                      <span className="font-medium">{place.name}</span>
                      <span className="text-muted-foreground">
                        {count > 0 ? `${count}` : "View"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      <FeaturedProperties
        properties={latest.data}
        title="Latest property for sale"
        subtitle="Houses, apartments, and land across Africa"
        viewAllHref="/properties?listingType=BUY"
        viewAllLabel="Browse all for sale"
      />

      <section className="border-t bg-card/50 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-center text-3xl font-semibold tracking-tight">
            Buying property in Africa
          </h2>
          <Accordion type="single" collapsible className="mt-8 w-full">
            {INDEX_FAQS.map((item, index) => (
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
