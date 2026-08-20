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
  searchForSaleByLocation,
} from "@/lib/properties";
import {
  getPlacesByRegion,
  propertyForSalePath,
} from "@/lib/property-for-sale";
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  faqPageJsonLd,
  itemListJsonLd,
} from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Property for Sale in Kenya — Houses, Apartments & Land",
  description:
    "Browse verified property for sale across all 47 Kenyan counties. Houses, apartments, and land in Nairobi, Kiambu, Kajiado, Nakuru, Mombasa, and every county. Compare KES prices on Your Home.",
  path: "/property-for-sale",
  keywords: [
    "property for sale Kenya",
    "houses for sale Nairobi",
    "houses for sale Kiambu",
    "land for sale Kenya",
    "plots for sale Kajiado",
    "property for sale Mombasa",
    "property for sale Nakuru",
  ],
});

export const revalidate = 3600;

const INDEX_FAQS = [
  {
    question: "Where can I find property for sale in Kenya?",
    answer:
      "Your Home lists verified houses, apartments, and land for sale in all 47 counties. Open a county page such as Nairobi, Kiambu, or Mombasa, or search the full marketplace.",
  },
  {
    question: "Does property for sale include land?",
    answer:
      "Yes. Each county page shows homes listed for sale and land/plots. You can also open Land & plots if you only want vacant land.",
  },
  {
    question: "How do listings get on Your Home?",
    answer:
      "Sellers and agents open a professional account, submit the property, and go live after Your Home admin approval. Buyers contact them from the listing.",
  },
];

export default async function PropertyForSaleIndexPage() {
  const [latest, counts] = await Promise.all([
    searchForSaleByLocation({ limit: 12 }),
    getForSaleCountsByCounty(),
  ]);
  const groups = getPlacesByRegion();
  const countyLinks = groups.flatMap((group) =>
    group.places.map((place) => ({
      name: `Property for sale in ${place.name}`,
      path: propertyForSalePath(place.slug),
    })),
  );

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
            itemListJsonLd("Property for sale by county in Kenya", countyLinks),
            faqPageJsonLd(INDEX_FAQS),
          ]),
        }}
      />

      <section className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <Badge className="mb-4 gap-1">
            <MapPin className="h-3.5 w-3.5" />
            All 47 counties
          </Badge>
          <h1 className="font-display max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Property for sale in Kenya
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Verified houses, apartments, and land for sale — from Nairobi,
            Kiambu, and Kajiado to Mombasa, Nakuru, Kisumu, and every county.
            Open a place to see local listings and buying notes.
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
              <Link href="/register/professional">List a property</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {groups.map((group) => (
          <div key={group.region} className="mb-12 last:mb-0">
            <h2 className="font-display text-2xl font-semibold">
              {group.region}
            </h2>
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

      <FeaturedProperties
        properties={latest.data}
        title="Latest property for sale"
        subtitle="Houses, apartments, and land across Kenya"
        viewAllHref="/properties?listingType=BUY"
        viewAllLabel="Browse all for sale"
      />

      <section className="border-t bg-card/50 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-center text-3xl font-semibold tracking-tight">
            Buying property in Kenya
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
