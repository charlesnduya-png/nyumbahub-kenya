import type { Metadata } from "next";
import Link from "next/link";

import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about NyumbaHub Kenya — the marketplace for verified homes, land, rentals, and BnB stays across Kenya.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <BrandLogo showKenya size="lg" className="mb-8" />
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            About NyumbaHub
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            We built NyumbaHub so Kenyans can buy, rent, list, and book stays
            with clearer listings, verified professionals, and payments that
            work locally.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-10 px-4 py-14 sm:px-6 lg:px-8">
        <div>
          <h2 className="font-display text-2xl font-semibold">What we do</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            NyumbaHub is a Kenya-focused real estate marketplace for homes,
            land, commercial space, monthly rentals, and BnB stays. Buyers and
            tenants browse for free. Sellers and agents list through paid plans,
            then go live after admin review.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl font-semibold">How it works</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>Search verified listings across counties and neighbourhoods</li>
            <li>Connect with sellers and agents through the platform inbox</li>
            <li>Professionals pay with M-Pesa to publish or promote listings</li>
            <li>Our admin team reviews listings before they appear publicly</li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-2xl font-semibold">Our promise</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Clear pricing, local payment options, and moderated inventory — so
            finding a home in Kenya feels safer and simpler.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild>
            <Link href="/properties">Browse properties</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/register/professional">List your property</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
