import Link from "next/link";
import { Globe, MapPin, Palmtree, Search } from "lucide-react";

import { AfricaMapBackdrop } from "@/components/africa/africa-map-backdrop";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AFRICA_COUNTRY_MARKETS,
  citySlug,
  featuredAfricaCountrySlugs,
  getAfricaMarketsByRegion,
} from "@/lib/africa-markets";
import { intentPlacePath } from "@/lib/location-seo";
import { getListingCountsByCountry } from "@/lib/properties";
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  itemListJsonLd,
} from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Real Estate Across Africa — Houses, Rent, Land & BnB",
  description:
    "Search verified houses, apartments, land, rentals, and BnB stays in all 54 African countries. Lagos, Nairobi, Accra, Cape Town, Cairo, Kigali, Dar es Salaam, and more on Your Home.",
  path: "/africa",
  keywords: [
    "Africa real estate",
    "property for sale Africa",
    "houses for rent Africa",
    "BnB Africa",
    "Airbnb Africa",
    "Lagos property",
    "Accra rentals",
    "Cape Town BnB",
    "Nairobi houses",
    "best real estate Africa",
  ],
});

export const revalidate = 3600;

export default async function AfricaHubPage() {
  const groups = getAfricaMarketsByRegion();
  const counts = await getListingCountsByCountry();
  const featured = AFRICA_COUNTRY_MARKETS.filter((country) =>
    featuredAfricaCountrySlugs().includes(country.slug),
  );
  const countryLinks = AFRICA_COUNTRY_MARKETS.filter(
    (country) => country.name !== "Kenya",
  ).map((country) => ({
    name: `Property in ${country.name}`,
    path: intentPlacePath("sale", country.slug),
  }));

  return (
    <div className="relative overflow-hidden gradient-mesh">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Africa real estate", path: "/africa" },
            ]),
            itemListJsonLd("African property markets", countryLinks),
          ]),
        }}
      />

      <section className="relative isolate min-h-[34rem] overflow-hidden border-b sm:min-h-[40rem] lg:min-h-[44rem]">
        <AfricaMapBackdrop />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="max-w-xl">
            <Badge className="mb-4 gap-1">
              <Globe className="h-3.5 w-3.5" />
              54 African countries
            </Badge>
            <h1 className="font-display max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              The best real estate, rentals & BnB stays across Africa
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Your Home lists verified houses, apartments, land, commercial space,
              monthly rentals, and holiday homes from Kenya to Nigeria, Ghana,
              South Africa, Egypt, Morocco, Tanzania, Uganda, Rwanda, and every
              African country.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/properties">
                  <Search className="mr-2 h-4 w-4" />
                  Search all listings
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/property-for-sale">Buy</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/rent">Rent</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/bnb">
                  <Palmtree className="mr-2 h-4 w-4" />
                  BnB
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-semibold">Featured markets</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {featured.map((country) => (
            <li key={country.slug}>
              <Link
                href={intentPlacePath("sale", country.slug)}
                className="flex flex-col rounded-2xl border bg-card/80 px-4 py-4 text-sm transition-colors hover:border-primary hover:text-primary"
              >
                <span className="font-medium">{country.name}</span>
                <span className="mt-1 text-muted-foreground">
                  {country.cities
                    .slice(0, 2)
                    .map((city) => city.name)
                    .join(" · ") || country.region}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {groups.map((group) => (
          <div key={group.region} className="mb-12 last:mb-0">
            <h2 className="font-display text-2xl font-semibold">
              {group.region}
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.countries.map((country) => {
                const count = counts[country.name.toLowerCase()] ?? 0;
                const href =
                  country.name === "Kenya"
                    ? "/property-for-sale"
                    : intentPlacePath("sale", country.slug);
                return (
                  <li key={country.slug}>
                    <Link
                      href={href}
                      className="flex items-center justify-between rounded-2xl border bg-card/80 px-4 py-3 text-sm transition-colors hover:border-primary hover:text-primary"
                    >
                      <span className="inline-flex items-center gap-2 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {country.name}
                      </span>
                      <span className="text-muted-foreground">
                        {count > 0 ? `${count}` : "View"}
                      </span>
                    </Link>
                    {country.cities.length > 0 ? (
                      <p className="mt-1.5 px-1 text-xs text-muted-foreground">
                        {country.cities.slice(0, 4).map((city, index) => (
                          <span key={city.name}>
                            {index > 0 ? " · " : ""}
                            <Link
                              href={intentPlacePath("sale", citySlug(city))}
                              className="hover:text-primary"
                            >
                              {city.name}
                            </Link>
                          </span>
                        ))}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
