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
import {
  AGENT_PRODUCTS,
  BOOST_PRODUCTS,
  LISTING_PRODUCTS,
  MONETIZATION_COPY,
  formatProductPrice,
  type PricingProduct,
} from "@/lib/pricing";

export const metadata = {
  title: "Pricing",
  description:
    "NyumbaHub Kenya pricing for property listings, featured boosts, and agent subscriptions. Pay with M-Pesa.",
};

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
          ? "relative border-primary shadow-lg shadow-primary/10"
          : "relative"
      }
    >
      {product.popular && (
        <Badge className="absolute -top-3 left-4">Most popular</Badge>
      )}
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
        <CardDescription>{product.description}</CardDescription>
        <p className="pt-2 text-3xl font-bold tracking-tight">
          {formatProductPrice(product)}
          <span className="text-sm font-normal text-muted-foreground">
            {" "}
            / {product.durationDays} days
          </span>
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {product.features.map((f) => (
            <li key={f} className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full" asChild variant={product.popular ? "default" : "outline"}>
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function PricingPage() {
  return (
    <div className="gradient-mesh">
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-sm text-muted-foreground backdrop-blur">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {MONETIZATION_COPY.buyersFree}
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Simple pricing for Kenyan sellers & agents
          </h1>
          <p className="mt-4 text-muted-foreground">
            {MONETIZATION_COPY.flow} Pay with M-Pesa, Visa, or Mastercard.
          </p>
        </div>

        <div className="mt-14">
          <h2 className="font-display text-2xl font-semibold">List a property</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Owners and landlords — pay once per listing, then wait for admin approval.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {LISTING_PRODUCTS.map((p) => (
              <PlanCard
                key={p.id}
                product={p}
                ctaHref={`/register/professional?plan=${p.id}`}
                ctaLabel="List with this plan"
              />
            ))}
          </div>
        </div>

        <div className="mt-16">
          <h2 className="font-display text-2xl font-semibold">Boost an existing listing</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Already live? Promote it for more buyer enquiries.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {BOOST_PRODUCTS.map((p) => (
              <PlanCard
                key={p.id}
                product={p}
                ctaHref="/dashboard/seller/promote"
                ctaLabel="Promote listing"
              />
            ))}
          </div>
        </div>

        <div className="mt-16">
          <h2 className="font-display text-2xl font-semibold">Agent subscriptions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Monthly plans for licensed agents and agencies.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {AGENT_PRODUCTS.map((p) => (
              <PlanCard
                key={p.id}
                product={p}
                ctaHref="/dashboard/agent/subscription"
                ctaLabel="Choose plan"
              />
            ))}
          </div>
        </div>

        <div className="mt-16 rounded-3xl border bg-card/80 p-8 text-center backdrop-blur">
          <h3 className="font-display text-2xl font-semibold">Buyers never pay</h3>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Searching, saving, and contacting listings stays free. Create a customer
            account anytime.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/register/professional">Open professional account</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/register">Customer signup</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
