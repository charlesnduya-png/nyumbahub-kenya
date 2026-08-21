import type { Metadata } from "next";
import Link from "next/link";

import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "About Your Home — Africa Real Estate Marketplace",
  description:
    "Your Home (yourhome.co.ke) is Africa's marketplace for verified homes, land, plots, rentals, and BnB stays. We connect buyers, tenants, sellers, and agents across Kenya and all 54 African countries.",
  path: "/about",
  keywords: [
    "Your Home Kenya",
    "Africa real estate platform",
    "verified property listings Africa",
    "yourhome.co.ke",
  ],
});

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <BrandLogo showKenya size="lg" className="mb-8" />
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            About Your Home
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            We built Your Home so people across Africa can buy, rent, list, and
            book stays with clearer listings, verified professionals, and
            payments that work locally — starting in Kenya.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-10 px-4 py-14 sm:px-6 lg:px-8">
        <div>
          <h2 className="font-display text-2xl font-semibold">What we do</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Your Home is an Africa-focused real estate marketplace for homes,
            land, commercial space, monthly rentals, and BnB stays. Buyers and
            tenants browse for free. Sellers and agents list through paid plans,
            then go live after admin review.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl font-semibold">How it works</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
            <li>Search verified listings across African countries and cities</li>
            <li>Connect with sellers and agents through the platform inbox</li>
            <li>Professionals pay with M-Pesa to publish or promote listings</li>
            <li>Our admin team reviews listings before they appear publicly</li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-2xl font-semibold">Our promise</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Clear pricing, local payment options, and moderated inventory — so
            finding a home in Africa feels safer and simpler.
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
