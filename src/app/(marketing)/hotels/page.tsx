import Link from "next/link";
import { Building2, Hotel, Search, Sparkles } from "lucide-react";
import { FeaturedProperties } from "@/components/home/featured-properties";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  countActiveProperties,
  getHotelPropertiesForHome,
} from "@/lib/properties";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Hotels in Africa | Nairobi, Lagos, Accra, Cape Town",
  description:
    "Book hotels, lodges, and serviced rooms across Africa on Your Home. Nairobi, Lagos, Accra, Cape Town, Mombasa, and city stays — priced per night with member savings.",
  path: "/hotels",
  keywords: [
    "hotels Africa",
    "hotels Nairobi",
    "hotels Lagos",
    "hotels Accra",
    "Cape Town hotels",
    "Mombasa hotels",
    "book hotel Kenya",
  ],
});

const destinations = [
  { name: "Nairobi", href: "/properties?listingType=HOTEL&town=Nairobi" },
  { name: "Mombasa", href: "/properties?listingType=HOTEL&town=Mombasa" },
  { name: "Lagos", href: "/properties?listingType=HOTEL&town=Lagos" },
  { name: "Accra", href: "/properties?listingType=HOTEL&town=Accra" },
  { name: "Cape Town", href: "/properties?listingType=HOTEL&town=Cape Town" },
  { name: "Kigali", href: "/properties?listingType=HOTEL&town=Kigali" },
  { name: "Kampala", href: "/properties?listingType=HOTEL&town=Kampala" },
  { name: "Addis Ababa", href: "/properties?listingType=HOTEL&town=Addis Ababa" },
];

export const revalidate = 60;

export default async function HotelsPage() {
  const [hotels, hotelCount] = await Promise.all([
    getHotelPropertiesForHome(24),
    countActiveProperties("HOTEL"),
  ]);

  return (
    <div className="gradient-mesh">
      <section className="relative overflow-hidden border-b">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Badge className="mb-4 gap-1">
            <Hotel className="h-3.5 w-3.5" />
            Hotels · Per night
          </Badge>
          <h1 className="font-display max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Hotels across Africa
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            City hotels, lodges, and serviced rooms — priced per night. Sign in
            for member savings, pick dates, and the host confirms your stay.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/properties?listingType=HOTEL">
                <Search className="mr-2 h-4 w-4" />
                Search hotels
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/register">Guest account (free)</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register/professional">List a hotel</Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-primary" />
              City hotels & lodges
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              Member prices when you sign in
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="font-display text-xl font-semibold">Top cities</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {destinations.map((d) => (
            <Button key={d.name} variant="outline" size="sm" asChild>
              <Link href={d.href}>{d.name}</Link>
            </Button>
          ))}
        </div>
      </section>

      <FeaturedProperties
        properties={hotels}
        title="Featured hotels"
        subtitle={`${hotelCount} hotel${hotelCount === 1 ? "" : "s"} · prices shown per night`}
        viewAllHref="/properties?listingType=HOTEL"
        viewAllLabel="View all hotels"
      />

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border bg-card/80 p-8 text-center backdrop-blur">
          <h2 className="font-display text-2xl font-semibold">
            List your hotel on Your Home
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Add rooms or the whole property. Guests book dates on the site, and
            you approve each stay from your bookings inbox.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/register/professional">List a hotel</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
