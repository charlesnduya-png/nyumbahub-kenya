"use client";

import { useState } from "react";
import { Loader2, Smartphone } from "lucide-react";
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
  /** @deprecated Card checkout removed — M-Pesa only. Kept for call-site compat. */
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
  embedded = false,
}: CheckoutProps) {
  const baseProduct = getProduct(productId);
  const product = baseProduct
    ? priceOverride != null
      ? { ...baseProduct, price: priceOverride }
      : baseProduct
    : undefined;
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

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
      toast.error(
        "Payment not confirmed yet. Complete the M-Pesa prompt on your phone, then tap pay again to finish activation.",
      );
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
        json.message ?? "Monthly listing plan active — you can submit listings now",
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

  async function startCheckout() {
    if (!phone.trim()) {
      toast.error("Enter your M-Pesa number");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          propertyId,
          phoneNumber: phone || undefined,
          method: "MPESA",
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Payment failed");
        return;
      }

      if (json.data?.status === "COMPLETED") {
        await syncAndFulfill(json.data);
        return;
      }

      if (json.data?.id) {
        if (json.data?.CustomerMessage) {
          toast.message(json.data.CustomerMessage);
        }
        await syncAndFulfill(json.data);
        return;
      }

      toast.success(json.data?.CustomerMessage ?? "Check your phone for M-Pesa");
    } catch {
      toast.error("Unable to start payment");
    } finally {
      setLoading(false);
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
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={loading}
        />
      </div>

      <Button
        type="button"
        className="w-full"
        disabled={loading}
        onClick={() => void startCheckout()}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Smartphone className="mr-2 h-4 w-4" />
        )}
        {loading
          ? "Starting payment…"
          : (ctaLabel ?? `Pay ${formatProductPrice(product)} with M-Pesa`)}
      </Button>
    </div>
  );
}
