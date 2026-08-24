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
  title: "Houses & Apartments for Rent in Africa | Nairobi, Lagos, Accra",
  description:
    "Find verified rentals across Africa — bedsitters, apartments, maisonettes, and family homes in Nairobi, Lagos, Accra, Kampala, Johannesburg, and every major city. Search on Your Home.",
  path: "/rent",
  keywords: [
    "houses for rent Nairobi",
    "apartments for rent Lagos",
    "Accra rentals",
    "Kampala apartments",
    "houses for rent Africa",
    "best rentals Africa",
  ],
});

export const revalidate = 60;

const rentalAreas = [
  { name: "Westlands", href: "/rent/westlands" },
  { name: "Kilimani", href: "/rent/kilimani" },
  { name: "Lagos", href: "/rent/lagos" },
  { name: "Accra", href: "/rent/accra" },
  { name: "Kampala", href: "/rent/kampala" },
  { name: "Johannesburg", href: "/rent/johannesburg" },
  { name: "Kigali", href: "/rent/kigali" },
  { name: "Dar es Salaam", href: "/rent/dar-es-salaam" },
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
            Rental houses & apartments across Africa
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Find bedsitter, 1–4 bedroom apartments, maisonettes, and family
            houses in Nairobi, Lagos, Accra, Kampala, and cities across Africa.
            Tenants browse free — contact landlords and agents directly.
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
