import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FREE_TIER_MAX_LISTINGS, PRICING_MUTED } from "@/lib/listing-flags";
import {
  BNB_BOOKING_COMMISSION_RATE,
  LISTING_PRODUCTS,
  MONETIZATION_COPY,
  PUBLIC_BOOST_PRODUCTS,
  formatProductPrice,
  type PricingProduct,
} from "@/lib/pricing";
import { AgencyPricingSection } from "@/components/pricing/agency-pricing-section";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: PRICING_MUTED
    ? "Free to use — Your Home Kenya"
    : "Pricing — List Property in Kenya",
  description: PRICING_MUTED
    ? `Your Home is free to use for now — list up to ${FREE_TIER_MAX_LISTINGS} properties and contact landlords at no charge.`
    : "Free 3 listings, agency plans from KES 1,500/month, featured listings, property promotions, and BnB booking commission on Your Home.",
  path: "/pricing",
});

function PlanCard({
  product,
  ctaHref,
  ctaLabel,
}: {
  product: PricingProduct;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <Card
      className={
        product.popular
          ? "border-primary shadow-md ring-1 ring-primary/20"
          : undefined
      }
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">{product.name}</CardTitle>
          {product.popular ? <Badge>Popular</Badge> : null}
        </div>
        <CardDescription>{product.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">
          {formatProductPrice(product)}
          <span className="text-sm font-normal text-muted-foreground">
            {product.category === "subscription" ? "/mo" : ""}
          </span>
        </p>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          {product.features.map((f) => (
            <li key={f} className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function PricingPage() {
  const commissionPct = Math.round(BNB_BOOKING_COMMISSION_RATE * 100);
  const boostIds = new Set([
    "featured_boost",
    "featured_boost_plus",
    "promote_standard",
    "promote_pro",
    "promote_max",
  ]);

  if (PRICING_MUTED) {
    return (
      <div className="gradient-mesh">
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-sm text-muted-foreground backdrop-blur">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Launch offer · Free to use
            </p>
            <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Everything is free for now
            </h1>
            <p className="mt-4 text-muted-foreground">
              List properties, chat, reserve, and call landlords at no charge
              while we grow. Paid plans (agent subscriptions, featured boosts,
              and the KES 150 viewing pass) will return later.
            </p>
          </div>

          <Card className="mt-10 border-primary/30">
            <CardHeader>
              <CardTitle>Free access</CardTitle>
              <CardDescription>
                For tenants, landlords, and agents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-3xl font-bold text-primary">
                KES 0
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  for now
                </span>
              </p>
              <ul className="space-y-2 text-muted-foreground">
                {[
                  `Up to ${FREE_TIER_MAX_LISTINGS} property listings`,
                  "Chat, reserve, WhatsApp & call — no viewing pass",
                  "Sale, rent, land, commercial & BnB",
                  "Admin quality review before listings go live",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 sm:flex-row">
              <Button asChild className="w-full sm:flex-1">
                <Link href="/register/professional">
                  Create free professional account
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:flex-1">
                <Link href="/register">Browse as a tenant</Link>
              </Button>
            </CardFooter>
          </Card>

          <div className="mt-14">
            <AgencyPricingSection
              planCtaDisabled
              planCtaLabel="Billing opens soon"
              mutedNote="Listing is free during launch. These are the agency plans when M-Pesa billing goes live."
            />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="gradient-mesh">
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-sm text-muted-foreground backdrop-blur">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {MONETIZATION_COPY.buyersFree}
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Pricing that scales with you
          </h1>
          <p className="mt-4 text-muted-foreground">
            {MONETIZATION_COPY.flow} Pay with M-Pesa.
          </p>
        </div>

        <div className="mt-14">
          <h2 className="font-display text-2xl font-semibold">Start free</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every professional account includes a free listing allowance.
          </p>
          <Card className="mt-6 max-w-md border-primary/30">
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>
                Landlords, owners, and agents — no card required
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-3xl font-bold text-primary">
                KES 0
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  / month
                </span>
              </p>
              <ul className="space-y-2 text-muted-foreground">
                {[
                  `Up to ${FREE_TIER_MAX_LISTINGS} active listings`,
                  "Sale, rent, land, commercial & BnB",
                  "WhatsApp & in-app buyer enquiries",
                  "Admin quality review before going live",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/register/professional">Create free account</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-16">
          <AgencyPricingSection planCtaHref="/dashboard/agent/subscription" />
        </div>

        <div className="mt-16">
          <h2 className="font-display text-2xl font-semibold">
            Landlord listing plans
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Need more than {FREE_TIER_MAX_LISTINGS} listings? Upgrade monthly.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {LISTING_PRODUCTS.map((p) => (
              <PlanCard
                key={p.id}
                product={p}
                ctaHref={`/register/professional?plan=${p.id}`}
                ctaLabel="Start monthly plan"
              />
            ))}
          </div>
        </div>

        <div className="mt-16">
          <h2 className="font-display text-2xl font-semibold">
            Featured listings & promotions
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Featured from KES 500 · Property promotion from KES 1,000.
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PUBLIC_BOOST_PRODUCTS.filter((p) => boostIds.has(p.id)).map(
              (p) => (
                <PlanCard
                  key={p.id}
                  product={p}
                  ctaHref="/dashboard/seller/promote"
                  ctaLabel="Promote listing"
                />
              ),
            )}
          </div>
        </div>

        <div className="mt-16">
          <h2 className="font-display text-2xl font-semibold">
            Tenant viewing pass
          </h2>
          <Card className="mt-6 max-w-xl">
            <CardHeader>
              <CardTitle>KES 150 · 24 hours</CardTitle>
              <CardDescription>
                Tenants pay once to chat, reserve, WhatsApp, or call landlords
                for 24 hours. When it expires, pay again to unlock contact.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Browsing listings stays free. Contact actions require an active
                viewing pass.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16">
          <h2 className="font-display text-2xl font-semibold">
            BnB booking commission
          </h2>
          <Card className="mt-6 max-w-xl">
            <CardHeader>
              <CardTitle>{commissionPct}% per confirmed booking</CardTitle>
              <CardDescription>
                Guests pay the host&apos;s nightly rate. Your Home takes a{" "}
                {commissionPct}% platform fee on confirmed BnB stays (within a
                5–15% industry range).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {MONETIZATION_COPY.bnbCommission} No monthly fee required to
                list a holiday home on the free tier.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline">
                <Link href="/bnb">Browse BnBs</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  );
}
