"use client";

import { useMemo, useState } from "react";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";
import { PaymentCheckout } from "@/components/payments/payment-checkout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BOOST_PRODUCTS,
  formatProductPrice,
  type BoostProductId,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

export default function SellerPromotePage() {
  const [selected, setSelected] = useState<BoostProductId>("featured_boost");
  const [lastPayment, setLastPayment] = useState<string | null>(null);

  const product = useMemo(
    () => BOOST_PRODUCTS.find((p) => p.id === selected)!,
    [selected],
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Promote your listings</h1>
        <p className="text-muted-foreground">
          Pay with M-Pesa to boost visibility. Featured and premium placements
          start after payment confirmation.
        </p>
      </div>

      {lastPayment && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          Payment received ({lastPayment}). Your boost is queued and will show on
          approved live listings.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {BOOST_PRODUCTS.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelected(plan.id as BoostProductId)}
              className={cn(
                "rounded-2xl border p-4 text-left transition",
                selected === plan.id
                  ? "border-primary bg-primary/5 shadow-md"
                  : "hover:border-primary/40",
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" />
                <span className="font-semibold">{plan.name}</span>
                {plan.popular && <Badge>Popular</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              <p className="mt-3 text-lg font-bold">
                {formatProductPrice(plan)}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  / {plan.durationDays}d
                </span>
              </p>
            </button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Checkout</CardTitle>
            <CardDescription>
              Selected: {product.name}. Demo mode works without M-Pesa API keys.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentCheckout
              productId={selected}
              onPaid={(payment) => {
                setLastPayment(payment.reference);
                toast.success("Boost purchased");
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
