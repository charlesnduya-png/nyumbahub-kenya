import Link from "next/link";
import { Palmtree, Search, Sparkles, Waves } from "lucide-react";
import { FeaturedProperties } from "@/components/home/featured-properties";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  countActiveProperties,
  getBnbPropertiesForHome,
} from "@/lib/properties";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "BnB & Holiday Homes in Kenya | Diani, Watamu, Nairobi Stays",
  description:
    "Book BnB stays, Airbnb-style apartments, beach villas, and safari cottages across Kenya. Diani, Watamu, Malindi, Naivasha, and city short stays on Your Home.",
  path: "/bnb",
  keywords: [
    "BnB Kenya",
    "Airbnb Kenya",
    "holiday homes Diani",
    "short stay Nairobi",
    "beach villa Kenya",
    "Watamu accommodation",
  ],
});

const destinations = [
  { name: "Diani", href: "/properties?listingType=HOLIDAY&town=Diani" },
  { name: "Watamu", href: "/properties?listingType=HOLIDAY&town=Watamu" },
  { name: "Malindi", href: "/properties?listingType=HOLIDAY&town=Malindi" },
  { name: "Naivasha", href: "/properties?listingType=HOLIDAY&town=Naivasha" },
  { name: "Kilimani", href: "/properties?listingType=HOLIDAY&town=Kilimani" },
  { name: "Maasai Mara", href: "/properties?listingType=HOLIDAY&town=Maasai+Mara" },
  { name: "Nyali", href: "/properties?listingType=HOLIDAY&town=Nyali" },
];

export default async function BnbPage() {
  const [bnbProperties, bnbCount] = await Promise.all([
    getBnbPropertiesForHome(24),
    countActiveProperties("HOLIDAY"),
  ]);

  return (
    <div className="gradient-mesh">
      <section className="relative overflow-hidden border-b">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Badge className="mb-4 gap-1 bg-teal-700 hover:bg-teal-700">
            <Palmtree className="h-3.5 w-3.5" />
            BnB · Short stays
          </Badge>
          <h1 className="font-display max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            BnB & holiday homes across Kenya
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Beach villas, city Airbnb apartments, lake cottages, and safari
            stays — priced per night. Book dates on Your Home; hosts approve
            each stay from their dashboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/properties?listingType=HOLIDAY">
                <Search className="mr-2 h-4 w-4" />
                Search BnB stays
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/register">Guest account (free)</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register/professional">Host a BnB</Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Waves className="h-4 w-4 text-primary" />
              Coast & lake stays
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              City Airbnb apartments
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="font-display text-xl font-semibold">Top destinations</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {destinations.map((d) => (
            <Button key={d.name} variant="outline" size="sm" asChild>
              <Link href={d.href}>{d.name}</Link>
            </Button>
          ))}
        </div>
      </section>

      <FeaturedProperties
        properties={bnbProperties}
        title="Featured BnB stays"
        subtitle={`${bnbCount} holiday home${bnbCount === 1 ? "" : "s"} · prices shown per night (KES)`}
        viewAllHref="/properties?listingType=HOLIDAY"
        viewAllLabel="View all BnBs"
      />

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border bg-card/80 p-8 text-center backdrop-blur">
          <h2 className="font-display text-2xl font-semibold">
            Become a host on Your Home
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            List your BnB, Airbnb apartment, or holiday villa. Guests book stays
            on the site, and you approve or decline each request from your
            bookings inbox.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/register/professional">List your BnB</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
