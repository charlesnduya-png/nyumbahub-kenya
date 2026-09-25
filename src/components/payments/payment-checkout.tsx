"use client";

import { useCallback, useState } from "react";
import { CreditCard, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { PesapalCardEmbed } from "@/components/payments/pesapal-card-embed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { isMonthlyListingProduct } from "@/lib/listing-subscription";
import { formatProductPrice, getProduct, type ProductId } from "@/lib/pricing";

type PayMethod = "MPESA" | "CARD";

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
  const [method, setMethod] = useState<PayMethod>("MPESA");
  const [loading, setLoading] = useState(false);
  const [cardEmbed, setCardEmbed] = useState<{
    checkoutUrl: string;
    paymentId: string;
    reference: string;
  } | null>(null);

  const finishPaid = useCallback(
    async (payment: {
      id: string;
      reference?: string;
      productId?: string;
      amount?: number;
      status?: string;
    }) => {
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
          json.message ??
            "Monthly listing plan active — you can submit listings now",
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
    },
    [onPaid, product, productId],
  );

  if (!product) {
    return (
      <p className="text-sm text-destructive">Unknown product: {productId}</p>
    );
  }

  async function startCheckout() {
    const payMethod = showCard ? method : "MPESA";
    if (payMethod === "MPESA" && !phone.trim()) {
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
          method: payMethod,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Payment failed");
        return;
      }

      if (json.data?.checkoutUrl) {
        const isPesapalEmbed =
          json.data?.provider === "pesapal" || json.data?.embed === true;
        if (isPesapalEmbed) {
          setCardEmbed({
            checkoutUrl: json.data.checkoutUrl,
            paymentId: json.data.id,
            reference: json.data.reference ?? json.data.id,
          });
          return;
        }
        window.location.href = json.data.checkoutUrl;
        return;
      }

      if (json.data?.status === "COMPLETED") {
        await finishPaid(json.data);
        return;
      }

      if (json.data?.id) {
        if (json.data?.CustomerMessage) {
          toast.message(json.data.CustomerMessage);
        }
        await finishPaid(json.data);
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

  const payLabel =
    ctaLabel ??
    (method === "CARD"
      ? `Pay ${formatProductPrice(product)} with card`
      : `Pay ${formatProductPrice(product)} with M-Pesa`);

  return (
    <>
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
              Pay once — list unlimited properties for {product.durationDays}{" "}
              days.
            </p>
          ) : null}
        </div>

        {showCard ? (
          <div className="space-y-2">
            <Label>Payment method</Label>
            <div
              className="grid grid-cols-2 gap-2"
              role="radiogroup"
              aria-label="Payment method"
            >
              <button
                type="button"
                role="radio"
                aria-checked={method === "MPESA"}
                disabled={loading || !!cardEmbed}
                onClick={() => setMethod("MPESA")}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm transition-colors",
                  method === "MPESA"
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/50",
                )}
              >
                <Smartphone className="h-5 w-5" />
                <span className="font-medium">M-Pesa</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={method === "CARD"}
                disabled={loading || !!cardEmbed}
                onClick={() => setMethod("CARD")}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm transition-colors",
                  method === "CARD"
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/50",
                )}
              >
                <CreditCard className="h-5 w-5" />
                <span className="font-medium">Card</span>
                <span className="text-[10px] leading-none text-muted-foreground">
                  Visa / Mastercard
                </span>
              </button>
            </div>
          </div>
        ) : null}

        {(!showCard || method === "MPESA") && (
          <div className="space-y-2">
            <Label htmlFor={`mpesa-${productId}`}>M-Pesa number</Label>
            <Input
              id={`mpesa-${productId}`}
              placeholder="0712345678"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading || !!cardEmbed}
            />
          </div>
        )}

        {showCard && method === "CARD" ? (
          <p className="text-xs text-muted-foreground">
            Card checkout opens securely inside Your Home — you stay on this
            site.
          </p>
        ) : null}

        <Button
          type="button"
          className="w-full"
          disabled={loading || !!cardEmbed}
          onClick={() => void startCheckout()}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : method === "CARD" && showCard ? (
            <CreditCard className="mr-2 h-4 w-4" />
          ) : (
            <Smartphone className="mr-2 h-4 w-4" />
          )}
          {loading ? "Starting payment…" : payLabel}
        </Button>
      </div>

      {cardEmbed ? (
        <PesapalCardEmbed
          checkoutUrl={cardEmbed.checkoutUrl}
          paymentId={cardEmbed.paymentId}
          amountLabel={formatProductPrice(product)}
          onClose={() => {
            setCardEmbed(null);
            toast.message("Card payment closed. You can try again anytime.");
          }}
          onComplete={(result) => {
            setCardEmbed(null);
            if (result.status === "FAILED") {
              toast.error("Card payment failed or was cancelled");
              return;
            }
            void finishPaid({
              id: result.paymentId,
              reference: cardEmbed.reference,
              status: result.status,
              amount: product.price,
            });
          }}
        />
      ) : null}
    </>
  );
}
