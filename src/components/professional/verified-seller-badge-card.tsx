"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { PaymentCheckoutDialog } from "@/components/payments/payment-checkout-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatProductPrice,
  getProduct,
  VERIFIED_BADGE_PRODUCT_ID,
} from "@/lib/pricing";

type ProfileSnapshot = {
  verificationStatus?: string;
  agentProfile?: { isVerified?: boolean; verificationStatus?: string } | null;
};

export function VerifiedSellerBadgeCard() {
  const product = getProduct(VERIFIED_BADGE_PRODUCT_ID);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileSnapshot | null>(null);
  const [paid, setPaid] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      const json = await res.json();
      if (!res.ok) return;
      setProfile(json.data ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isVerified =
    paid ||
    profile?.agentProfile?.isVerified ||
    profile?.verificationStatus === "VERIFIED";

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading verification…
        </CardContent>
      </Card>
    );
  }

  if (isVerified) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Verified seller badge</CardTitle>
            <Badge className="gap-1 bg-primary text-primary-foreground">
              <BadgeCheck className="h-3 w-3" />
              Active
            </Badge>
          </div>
          <CardDescription>
            Your profile shows the verified badge to buyers and tenants.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Verified seller badge</CardTitle>
        </div>
        <CardDescription>
          Build trust with a verified mark on your profile and listings for{" "}
          {product.durationDays} days.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm">
          <p className="font-semibold">
            {formatProductPrice(product)}{" "}
            <span className="font-normal text-muted-foreground">
              / {product.durationDays} days
            </span>
          </p>
          <ul className="mt-2 list-inside list-disc text-muted-foreground">
            {product.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>

        <PaymentCheckoutDialog
          productId={VERIFIED_BADGE_PRODUCT_ID}
          showCard={false}
          triggerLabel={`Get verified · ${formatProductPrice(product)}`}
          title="Verified seller badge"
          description={`Build trust on your profile for ${product.durationDays} days after payment.`}
          ctaLabel={`Pay ${formatProductPrice(product)} with M-Pesa`}
          onPaid={async (payment) => {
            if (payment.status === "COMPLETED") {
              setPaid(true);
              toast.success("Verified seller badge activated");
              void load();
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
