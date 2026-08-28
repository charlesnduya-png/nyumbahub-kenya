"use client";

import { useEffect, useMemo, useState } from "react";
import { Megaphone } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BOOST_PRODUCTS,
  PUBLIC_BOOST_PRODUCTS,
  formatProductPrice,
  type BoostProductId,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

const PROMOTE_OPTIONS = [...PUBLIC_BOOST_PRODUCTS];

type ListingOption = {
  id: string;
  title: string;
  town: string;
  county: string;
  status: string;
};

export default function SellerPromotePage() {
  const [selected, setSelected] = useState<BoostProductId>("featured_boost");
  const [lastPayment, setLastPayment] = useState<string | null>(null);
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [propertyId, setPropertyId] = useState<string>("all");

  const product = useMemo(
    () => BOOST_PRODUCTS.find((p) => p.id === selected)!,
    [selected],
  );

  const needsListing = selected.startsWith("promote_");

  useEffect(() => {
    void fetch("/api/properties/mine")
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) return;
        const active = (json.data ?? []).filter(
          (item: ListingOption) => item.status === "ACTIVE",
        );
        setListings(active);
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (needsListing && propertyId === "all" && listings.length > 0) {
      setPropertyId(listings[0].id);
    }
    if (!needsListing) {
      setPropertyId("all");
    }
  }, [needsListing, listings, propertyId]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Promote your listings</h1>
        <p className="text-muted-foreground">
          Featured listings from KES 500 · Property promotions from KES 1,000.
          Pay with M-Pesa via IntaSend.
        </p>
      </div>

      {lastPayment && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          Payment received ({lastPayment}). Your boost is now active on your
          live listing{needsListing || propertyId !== "all" ? "" : "s"}.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {PROMOTE_OPTIONS.map((plan) => (
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
              Selected: {product.name}. Enter your M-Pesa number to pay.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {listings.length > 0 ? (
              <div className="space-y-2">
                <Label>Apply boost to</Label>
                <Select
                  value={propertyId}
                  onValueChange={setPropertyId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose listing" />
                  </SelectTrigger>
                  <SelectContent>
                    {!needsListing ? (
                      <SelectItem value="all">All active listings</SelectItem>
                    ) : null}
                    {listings.map((listing) => (
                      <SelectItem key={listing.id} value={listing.id}>
                        {listing.title} · {listing.town}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {needsListing && listings.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    You need at least one active listing to run this promotion.
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No active listings yet. Featured boosts apply once a listing is
                live.
              </p>
            )}

            <PaymentCheckout
              productId={selected}
              propertyId={propertyId === "all" ? undefined : propertyId}
              onPaid={(payment) => {
                if (payment.status === "COMPLETED") {
                  setLastPayment(payment.reference);
                  toast.success("Boost activated on your listing(s)");
                }
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
