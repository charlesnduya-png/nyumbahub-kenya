import type { Metadata } from "next";
import Link from "next/link";

import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "About Your Home — Africa Real Estate Marketplace",
  description:
    "Your Home (yourhome.co.ke and yourhome.africa) is Africa's marketplace for verified homes, land, plots, rentals, and BnB stays. Buyers, tenants, sellers, and agents create free accounts across all 54 African countries.",
  path: "/about",
  keywords: [
    "Your Home Kenya",
    "Africa real estate platform",
    "verified property listings Africa",
    "create account Your Home Africa",
    "yourhome.co.ke",
    "yourhome.africa",
  ],
});

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <BrandLogo size="lg" className="mb-8" />
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            About Your Home
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            We built Your Home so people across Africa can buy, rent, list, and
            book stays with clearer listings, verified professionals, and
            payments that work locally — from Kenya to Nigeria, Ghana, South
            Africa, and every African market we serve.
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
          <h2 className="font-display text-2xl font-semibold">Ways to earn</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Your Home is built for people who want to grow income from property
            across Africa. Job partners earn referral commission when agencies
            and hotels they introduce pay monthly plans. Landlords and agents
            earn by listing homes, land, and rentals. BnB hosts earn from
            confirmed stays.{" "}
            <Link
              href="/partners"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              See how to earn on Your Home
            </Link>
            .
          </p>
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
          <Button variant="outline" asChild>
            <Link href="/partners">Earn as a partner</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
