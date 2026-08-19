import Link from "next/link";
import { KeyRound, Search, ShieldCheck } from "lucide-react";
import { FeaturedProperties } from "@/components/home/featured-properties";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  countActiveProperties,
  getRentalPropertiesForHome,
} from "@/lib/properties";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Houses & Apartments for Rent in Kenya | Nairobi, Mombasa & More",
  description:
    "Find verified rentals across Kenya — bedsitters, apartments, maisonettes, and family homes in Westlands, Kilimani, Syokimau, Nyali, and all major towns. Search on Your Home.",
  path: "/rent",
  keywords: [
    "houses for rent Nairobi",
    "apartments for rent Kenya",
    "bedsitter Nairobi",
    "maisonette for rent",
    "Westlands rentals",
    "Kilimani apartments rent",
    "nyumba za kukodi Nairobi",
  ],
});

// This page must update immediately when rentals are marked RENTED.
export const dynamic = "force-dynamic";

const rentalAreas = [
  { name: "Westlands", href: "/properties?listingType=RENT&town=Westlands" },
  { name: "Kilimani", href: "/properties?listingType=RENT&town=Kilimani" },
  { name: "Syokimau", href: "/properties?listingType=RENT&town=Syokimau" },
  { name: "Lavington", href: "/properties?listingType=RENT&town=Lavington" },
  { name: "South B", href: "/properties?listingType=RENT&town=South+B" },
  { name: "Roysambu", href: "/properties?listingType=RENT&town=Roysambu" },
  { name: "Kisumu", href: "/properties?listingType=RENT&county=Kisumu" },
  { name: "Nyali", href: "/properties?listingType=RENT&town=Nyali" },
];

export default async function RentPage() {
  const [allRentals, rentalCount] = await Promise.all([
    getRentalPropertiesForHome(24),
    countActiveProperties("RENT"),
  ]);

  return (
    <div className="gradient-mesh">
      <section className="relative overflow-hidden border-b">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Badge className="mb-4 gap-1">
            <KeyRound className="h-3.5 w-3.5" />
            For rent
          </Badge>
          <h1 className="font-display max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Rental houses & apartments in Kenya
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Find bedsitter, 1–4 bedroom apartments, maisonettes, and family
            houses. Tenants browse free — contact landlords and agents directly.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/properties?listingType=RENT">
                <Search className="mr-2 h-4 w-4" />
                Search all rentals
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/register">Create free tenant account</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register/professional">
                List a rental property
              </Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Verified listings · WhatsApp contact · Book viewings
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="font-display text-xl font-semibold">Popular rental areas</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {rentalAreas.map((area) => (
            <Button key={area.name} variant="outline" size="sm" asChild>
              <Link href={area.href}>{area.name}</Link>
            </Button>
          ))}
        </div>
      </section>

      <FeaturedProperties
        properties={allRentals}
        title="Homes for rent"
        subtitle={`${rentalCount} rental listing${rentalCount === 1 ? "" : "s"} · prices shown per month (KES)`}
      />

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border bg-card/80 p-8 text-center backdrop-blur">
          <h2 className="font-display text-2xl font-semibold">
            Are you a landlord?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Open a professional account, list your rental for free for now, and go
            live after admin approval. Tenants inquire via WhatsApp and inbox.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/register/professional">List a house for rent</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
