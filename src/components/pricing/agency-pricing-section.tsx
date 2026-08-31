import Link from "next/link";
import { Check } from "lucide-react";
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
  AGENCY_PLANS,
  FREE_AGENCY_PLAN,
  formatAgencyListingCap,
} from "@/lib/agency-plans";
import { AGENT_PRODUCTS, formatProductPrice, type PricingProduct } from "@/lib/pricing";

function AgencyPlanCard({
  product,
  ctaHref,
  ctaLabel,
  ctaDisabled,
}: {
  product: PricingProduct;
  ctaHref?: string;
  ctaLabel: string;
  ctaDisabled?: boolean;
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
          <span className="text-sm font-normal text-muted-foreground">/mo</span>
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
        {ctaDisabled || !ctaHref ? (
          <Button className="w-full" variant="secondary" disabled>
            {ctaLabel}
          </Button>
        ) : (
          <Button asChild className="w-full">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function FreeAgencyPlanCard({
  ctaHref,
  ctaLabel,
  ctaDisabled,
}: {
  ctaHref?: string;
  ctaLabel: string;
  ctaDisabled?: boolean;
}) {
  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="text-lg">{FREE_AGENCY_PLAN.name}</CardTitle>
        <CardDescription>{FREE_AGENCY_PLAN.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">
          KSh 0
          <span className="text-sm font-normal text-muted-foreground">/mo</span>
        </p>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          {FREE_AGENCY_PLAN.features.map((f) => (
            <li key={f} className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {ctaDisabled || !ctaHref ? (
          <Button className="w-full" variant="secondary" disabled>
            {ctaLabel}
          </Button>
        ) : (
          <Button asChild className="w-full">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export function AgencyPricingSection({
  showPlanCards = true,
  showFreePlan = true,
  asPageTitle = false,
  planCtaHref = "/dashboard/agent/subscription",
  freePlanCtaHref = "/register/professional",
  planCtaLabel = "Choose plan",
  freePlanCtaLabel = "Start free",
  planCtaDisabled = false,
  mutedNote,
}: {
  showPlanCards?: boolean;
  showFreePlan?: boolean;
  asPageTitle?: boolean;
  planCtaHref?: string;
  freePlanCtaHref?: string;
  planCtaLabel?: string;
  freePlanCtaLabel?: string;
  planCtaDisabled?: boolean;
  mutedNote?: string;
}) {
  const Heading = asPageTitle ? "h1" : "h2";

  return (
    <div className="space-y-6">
      <div>
        <Heading
          className={
            asPageTitle
              ? "font-display text-4xl font-semibold tracking-tight sm:text-5xl"
              : "font-display text-2xl font-semibold"
          }
        >
          Recommended agency pricing
        </Heading>
        <p className="mt-1 text-sm text-muted-foreground">
          Start with {formatAgencyListingCap(FREE_AGENCY_PLAN.maxListings)} on Free,
          then upgrade from KES 1,500/month.
        </p>
        {mutedNote ? (
          <p className="mt-2 text-sm text-primary">{mutedNote}</p>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">Package</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Listings</th>
              <th className="px-4 py-3 font-medium">Best for</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {AGENCY_PLANS.map((plan) => (
              <tr key={plan.id}>
                <td className="px-4 py-3 font-medium">
                  {plan.name}
                  {plan.popular ? " ⭐" : ""}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {plan.price === 0
                    ? "KSh 0"
                    : plan.id === "ENTERPRISE"
                      ? "KSh 15,000+ / month"
                      : `KSh ${plan.price.toLocaleString("en-KE")} / month`}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatAgencyListingCap(plan.maxListings)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{plan.bestFor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPlanCards ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {showFreePlan ? (
            <FreeAgencyPlanCard
              ctaHref={freePlanCtaHref}
              ctaLabel={freePlanCtaLabel}
              ctaDisabled={planCtaDisabled}
            />
          ) : null}
          {AGENT_PRODUCTS.map((p) => (
            <AgencyPlanCard
              key={p.id}
              product={p}
              ctaHref={planCtaHref}
              ctaLabel={planCtaLabel}
              ctaDisabled={planCtaDisabled}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
