"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { CreditCard, Smartphone } from "lucide-react";

import { PaymentCheckout } from "@/components/payments/payment-checkout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatProductPrice, getProduct, type ProductId } from "@/lib/pricing";

type PaidPayload = {
  id: string;
  reference: string;
  productId: string;
  amount: number;
  status: string;
};

interface PaymentCheckoutDialogProps {
  productId: ProductId | string;
  propertyId?: string;
  /** Override displayed and expected checkout amount (e.g. admin-edited hotel plan prices). */
  priceOverride?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hide the default pay button (use with controlled open + your own trigger). */
  hideTrigger?: boolean;
  triggerLabel?: string;
  triggerClassName?: string;
  triggerVariant?: ComponentProps<typeof Button>["variant"];
  triggerSize?: ComponentProps<typeof Button>["size"];
  title?: string;
  description?: string;
  ctaLabel?: string;
  /** Show Visa/Mastercard (Pesapal) alongside M-Pesa. Default on. */
  showCard?: boolean;
  /** Extra fields shown above checkout inside the popup (e.g. listing picker). */
  dialogExtra?: ReactNode;
  onPaid?: (payment: PaidPayload) => void;
}

export function PaymentCheckoutDialog({
  productId,
  propertyId,
  priceOverride,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
  triggerLabel,
  triggerClassName,
  triggerVariant = "default",
  triggerSize = "default",
  title,
  description,
  ctaLabel,
  showCard = true,
  dialogExtra,
  onPaid,
}: PaymentCheckoutDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const baseProduct = getProduct(productId);
  const product = baseProduct
    ? priceOverride != null
      ? { ...baseProduct, price: priceOverride }
      : baseProduct
    : undefined;

  if (!product) {
    return (
      <p className="text-sm text-destructive">Unknown product: {productId}</p>
    );
  }

  const defaultTrigger = showCard
    ? `Pay ${formatProductPrice(product)}`
    : `Pay ${formatProductPrice(product)} with M-Pesa`;

  return (
    <>
      {!hideTrigger ? (
        <Button
          type="button"
          variant={triggerVariant}
          size={triggerSize}
          className={triggerClassName}
          onClick={() => setOpen(true)}
        >
          {showCard ? (
            <span className="mr-2 inline-flex items-center gap-0.5">
              <Smartphone className="h-4 w-4" />
              <CreditCard className="h-4 w-4" />
            </span>
          ) : (
            <Smartphone className="mr-2 h-4 w-4" />
          )}
          {triggerLabel ?? defaultTrigger}
        </Button>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md gap-0 p-0 sm:max-w-md">
          <DialogHeader className="space-y-2 border-b px-6 py-5 pr-12 text-left">
            <DialogTitle>{title ?? product.name}</DialogTitle>
            <DialogDescription>
              {description ??
                (showCard
                  ? "Choose M-Pesa or card (Visa / Mastercard), then complete payment."
                  : "Enter your M-Pesa number. You'll get a prompt on your phone to complete payment.")}
            </DialogDescription>
          </DialogHeader>
          {open ? (
            <div className="space-y-4 px-6 py-5">
              {dialogExtra}
              <PaymentCheckout
                embedded
                productId={productId}
                propertyId={propertyId}
                priceOverride={priceOverride}
                showCard={showCard}
                ctaLabel={ctaLabel}
                onPaid={(payment) => {
                  onPaid?.(payment);
                  if (payment.status === "COMPLETED") {
                    setOpen(false);
                  }
                }}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
