"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PaymentCheckout } from "@/components/payments/payment-checkout";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AGENT_PRODUCTS,
  formatProductPrice,
  type AgentProductId,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

export default function AgentSubscriptionPage() {
  const [selected, setSelected] = useState<AgentProductId>("agent_pro");
  const [activePlan, setActivePlan] = useState<string | null>(null);

  const product = useMemo(
    () => AGENT_PRODUCTS.find((p) => p.id === selected)!,
    [selected],
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Agent subscription</h1>
        <p className="text-muted-foreground">
          Monthly M-Pesa billing for agents. Higher plans unlock more active
          listings and CRM tools.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
          <CardDescription>
            {activePlan
              ? `${activePlan} is active on this demo account.`
              : "No paid subscription yet — choose a plan below."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activePlan ? (
            <Badge>Active · {activePlan}</Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="grid gap-4 md:grid-cols-3">
          {AGENT_PRODUCTS.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelected(plan.id as AgentProductId)}
              className={cn(
                "rounded-2xl border p-4 text-left transition",
                selected === plan.id
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/40",
              )}
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
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pay for {product.name}</CardTitle>
            <CardDescription>
              {formatProductPrice(product)} billed every{" "}
              {product.durationDays} days via M-Pesa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentCheckout
              productId={selected}
              ctaLabel="Subscribe with M-Pesa"
              onPaid={(payment) => {
                setActivePlan(product.name);
                toast.success(`Subscribed · ${payment.reference}`);
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
