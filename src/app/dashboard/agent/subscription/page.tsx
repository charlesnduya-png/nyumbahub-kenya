"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Smartphone } from "lucide-react";
import { toast } from "sonner";
import { PaymentCheckoutDialog } from "@/components/payments/payment-checkout-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FREE_TIER_MAX_LISTINGS, LISTINGS_ARE_FREE } from "@/lib/listing-flags";
import {
  AGENT_PRODUCTS,
  formatProductPrice,
  type AgentProductId,
} from "@/lib/pricing";
import { AgencyPricingSection } from "@/components/pricing/agency-pricing-section";
import { cn } from "@/lib/utils";

export default function AgentSubscriptionPage() {
  const [selected, setSelected] = useState<AgentProductId>("agent_pro");
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);

  const product = useMemo(
    () => AGENT_PRODUCTS.find((p) => p.id === selected)!,
    [selected],
  );

  if (LISTINGS_ARE_FREE) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Agent plan</h1>
          <p className="text-muted-foreground">
            Paid subscriptions are paused — Your Home is free to use for now.
          </p>
        </div>
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Free access</CardTitle>
            <CardDescription>
              List up to {FREE_TIER_MAX_LISTINGS} properties at no charge. Chat
              and contact tools are unlocked without a viewing pass.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge>Active · Free</Badge>
            <Button asChild>
              <Link href="/dashboard/seller/properties/new">
                List a property
              </Link>
            </Button>
          </CardContent>
        </Card>

        <AgencyPricingSection
          showPlanCards={false}
          mutedNote="Reference pricing for when agency billing goes live. You are on the free launch tier today."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Agent subscription</h1>
        <p className="text-muted-foreground">
          Free accounts get {FREE_TIER_MAX_LISTINGS} listings. Upgrade from KES
          1,500/month for more inventory and tools.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
          <CardDescription>
            {activePlan
              ? `${activePlan} is active on your account.`
              : `Free tier · up to ${FREE_TIER_MAX_LISTINGS} listings. Choose a paid plan below to scale.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activePlan ? (
            <Badge>Active · {activePlan}</Badge>
          ) : (
            <Badge variant="secondary">
              Free · {FREE_TIER_MAX_LISTINGS} listings
            </Badge>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {AGENT_PRODUCTS.map((plan) => {
          const isSelected = selected === plan.id;
          return (
            <div
              key={plan.id}
              className={cn(
                "rounded-2xl border p-4 transition",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/40",
              )}
            >
              <button
                type="button"
                onClick={() => setSelected(plan.id as AgentProductId)}
                className="w-full text-left"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="font-semibold">{plan.name}</p>
                  {plan.popular && <Badge>Popular</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                <p className="mt-3 text-xl font-bold">
                  {formatProductPrice(plan)}
                  <span className="text-xs font-normal text-muted-foreground">
                    /mo
                  </span>
                </p>
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {plan.features.slice(0, 3).map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>
              </button>

              {isSelected ? (
                <Button
                  type="button"
                  className="mt-4 w-full"
                  onClick={() => setPayOpen(true)}
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  Subscribe with M-Pesa
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground">
        Prefer to stay free?{" "}
        <Link href="/dashboard/seller/properties/new" className="underline">
          List up to {FREE_TIER_MAX_LISTINGS} properties
        </Link>{" "}
        without paying.
      </p>

      <PaymentCheckoutDialog
        hideTrigger
        open={payOpen}
        onOpenChange={setPayOpen}
        productId={selected}
        title={`Pay for ${product.name}`}
        description={`${formatProductPrice(product)} billed every ${product.durationDays} days via M-Pesa.`}
        ctaLabel="Subscribe with M-Pesa"
        onPaid={(payment) => {
          setActivePlan(product.name);
          toast.success(`Subscribed · ${payment.reference}`);
        }}
      />
    </div>
  );
}
