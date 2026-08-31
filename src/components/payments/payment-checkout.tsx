"use client";

import { useState } from "react";
import { CreditCard, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { isMonthlyListingProduct } from "@/lib/listing-subscription";
import { formatProductPrice, getProduct, type ProductId } from "@/lib/pricing";

interface CheckoutProps {
  productId: ProductId | string;
  propertyId?: string;
  priceOverride?: number;
  onPaid?: (payment: {
    id: string;
    reference: string;
    productId: string;
    amount: number;
    status: string;
  }) => void;
  ctaLabel?: string;
  showCard?: boolean;
  /** Drop outer card chrome — use inside dialogs. */
  embedded?: boolean;
}

export function PaymentCheckout({
  productId,
  propertyId,
  priceOverride,
  onPaid,
  ctaLabel,
  showCard = true,
  embedded = false,
}: CheckoutProps) {
  const baseProduct = getProduct(productId);
  const product = baseProduct
    ? priceOverride != null
      ? { ...baseProduct, price: priceOverride }
      : baseProduct
    : undefined;
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState<"mpesa" | "card" | null>(null);

  if (!product) {
    return (
      <p className="text-sm text-destructive">Unknown product: {productId}</p>
    );
  }

  async function syncAndFulfill(payment: {
    id: string;
    reference?: string;
    productId?: string;
    amount?: number;
    status?: string;
  }) {
    let status = payment.status ?? "PENDING";

    if (status !== "COMPLETED") {
      toast.message("Check your phone to complete M-Pesa payment");
      for (let attempt = 0; attempt < 40; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const res = await fetch(`/api/payments/${payment.id}/sync`, {
          method: "POST",
        });
        const json = await res.json();
        if (!res.ok || !json.success) continue;
        status = json.data?.status ?? status;
        if (status === "COMPLETED") break;
        if (status === "FAILED") {
          toast.error("Payment failed or was cancelled");
          return;
        }
      }
    }

    if (status !== "COMPLETED") {
      onPaid?.({
        id: payment.id,
        reference: payment.reference ?? payment.id,
        productId: String(productId),
        amount: payment.amount ?? product!.price,
        status: "PENDING",
      });
      return;
    }

    if (isMonthlyListingProduct(String(productId))) {
      const res = await fetch("/api/subscriptions/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: payment.id, productId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Could not activate monthly plan");
        return;
      }
      toast.success(
        json.message ?? "Monthly listing plan active — list unlimited properties",
      );
    } else {
      toast.success("Payment received — your purchase is now active");
    }

    onPaid?.({
      id: payment.id,
      reference: payment.reference ?? payment.id,
      productId: String(productId),
      amount: payment.amount ?? product!.price,
      status: "COMPLETED",
    });
  }

  async function activateMonthlyIfNeeded(payment: {
    id: string;
    reference?: string;
    productId?: string;
    amount?: number;
    status?: string;
  }) {
    await syncAndFulfill(payment);
  }

  async function startCheckout(method: "MPESA" | "CARD") {
    setLoading(method === "MPESA" ? "mpesa" : "card");
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          propertyId,
          phoneNumber: phone || undefined,
          method,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Payment failed");
        return;
      }

      if (json.data?.checkoutUrl) {
        window.location.href = json.data.checkoutUrl;
        return;
      }

      if (json.data?.status === "COMPLETED") {
        await activateMonthlyIfNeeded(json.data);
        return;
      }

      // M-Pesa STK started (or pending) — activate monthly access for this payment
      if (json.data?.id) {
        if (json.data?.CustomerMessage) {
          toast.message(json.data.CustomerMessage);
        }
        await activateMonthlyIfNeeded(json.data);
        return;
      }

      toast.success(json.data?.CustomerMessage ?? "Check your phone for M-Pesa");
    } catch {
      toast.error("Unable to start payment");
    } finally {
      setLoading(null);
    }
  }

  const periodLabel =
    product.category === "subscription"
      ? `/ month`
      : `/ ${product.durationDays} days`;

  return (
    <div
      className={cn(
        "space-y-4",
        !embedded && "rounded-2xl border bg-card p-4",
      )}
    >
      <div>
        <p className="text-sm text-muted-foreground">{product.name}</p>
        <p className="text-2xl font-bold text-primary">
          {formatProductPrice(product)}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {periodLabel}
          </span>
        </p>
        {product.category === "subscription" ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Pay once — list unlimited properties for {product.durationDays} days.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`mpesa-${productId}`}>M-Pesa number</Label>
        <Input
          id={`mpesa-${productId}`}
          placeholder="0712345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          disabled={!!loading}
          onClick={() => void startCheckout("MPESA")}
        >
          {loading === "mpesa" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Smartphone className="mr-2 h-4 w-4" />
          )}
          {ctaLabel ?? "Pay with M-Pesa"}
        </Button>

        {showCard && (
          <Button
            type="button"
            variant="outline"
            disabled={!!loading}
            onClick={() => void startCheckout("CARD")}
          >
            {loading === "card" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            Pay with Visa / Mastercard
          </Button>
        )}
      </div>
    </div>
  );
}
