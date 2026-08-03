"use client";

import { useState } from "react";
import { CreditCard, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatProductPrice, getProduct, type ProductId } from "@/lib/pricing";

interface CheckoutProps {
  productId: ProductId | string;
  propertyId?: string;
  onPaid?: (payment: {
    id: string;
    reference: string;
    productId: string;
    amount: number;
    status: string;
  }) => void;
  ctaLabel?: string;
  showCard?: boolean;
}

export function PaymentCheckout({
  productId,
  propertyId,
  onPaid,
  ctaLabel,
  showCard = true,
}: CheckoutProps) {
  const product = getProduct(productId);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState<"mpesa" | "card" | "demo" | null>(
    null,
  );

  if (!product) {
    return (
      <p className="text-sm text-destructive">Unknown product: {productId}</p>
    );
  }

  async function startCheckout(method: "MPESA" | "CARD", confirmDemo = false) {
    setLoading(method === "MPESA" ? (confirmDemo ? "demo" : "mpesa") : "card");
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          propertyId,
          phoneNumber: phone || "0712345678",
          method,
          confirmDemo,
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
        toast.success(`Payment confirmed · ${json.data.reference}`);
        onPaid?.(json.data);
        return;
      }

      if (json.stub) {
        toast.message("STK push simulated", {
          description: "Click Confirm demo payment to continue without M-Pesa keys.",
        });
        return;
      }

      toast.success(json.data?.CustomerMessage ?? "Check your phone for M-Pesa");
    } catch {
      toast.error("Unable to start payment");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-4">
      <div>
        <p className="text-sm text-muted-foreground">{product.name}</p>
        <p className="text-2xl font-bold text-primary">
          {formatProductPrice(product)}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            / {product.durationDays} days
          </span>
        </p>
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

        <Button
          type="button"
          variant="secondary"
          disabled={!!loading}
          onClick={() => void startCheckout("MPESA", true)}
        >
          {loading === "demo" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Confirm demo payment
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
