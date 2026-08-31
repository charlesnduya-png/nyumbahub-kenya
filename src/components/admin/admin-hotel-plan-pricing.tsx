"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HotelPlanProduct } from "@/lib/hotel-plans";
import { formatPrice } from "@/lib/utils";

type DraftRow = {
  tier: string;
  name: string;
  price: string;
  currency: string;
  popular?: boolean;
};

function draftsFromPlans(plans: HotelPlanProduct[]): DraftRow[] {
  return plans.map((plan) => ({
    tier: plan.id,
    name: plan.name,
    price: String(plan.price),
    currency: plan.currency,
    popular: plan.popular,
  }));
}

export function AdminHotelPlanPricing({
  initialPlans,
}: {
  initialPlans: HotelPlanProduct[];
}) {
  const [drafts, setDrafts] = useState<DraftRow[]>(() => draftsFromPlans(initialPlans));
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    const res = await fetch("/api/admin/hotel-plans/pricing");
    const json = (await res.json()) as {
      success?: boolean;
      data?: HotelPlanProduct[];
    };
    if (json.success && json.data) {
      setDrafts(draftsFromPlans(json.data));
    }
  }, []);

  useEffect(() => {
    setDrafts(draftsFromPlans(initialPlans));
  }, [initialPlans]);

  async function savePrices() {
    setSaving(true);
    try {
      const prices = drafts.map((row) => ({
        tier: row.tier,
        price: row.tier === "FREE" ? 0 : Number(row.price),
        currency: row.currency.trim() || "KES",
      }));

      for (const row of prices) {
        if (row.tier !== "FREE" && (Number.isNaN(row.price) || row.price <= 0)) {
          toast.error(`Enter a valid price for ${row.tier}`);
          return;
        }
      }

      const res = await fetch("/api/admin/hotel-plans/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prices }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Could not save hotel plan prices");
        return;
      }

      toast.success("Hotel plan prices updated");
      await reload();
    } catch {
      toast.error("Could not save hotel plan prices");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Hotel plan pricing</CardTitle>
        <p className="text-sm text-muted-foreground">
          Set monthly prices operators pay for Starter through Enterprise. Changes apply
          immediately to checkout and the public hotels pricing showcase.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {drafts.map((row) => (
            <div key={row.tier} className="space-y-2 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{row.name}</p>
                {row.popular ? <Badge>Popular</Badge> : null}
              </div>
              {row.tier === "FREE" ? (
                <p className="text-sm text-muted-foreground">
                  {formatPrice(0, { currency: row.currency })} / month
                </p>
              ) : (
                <>
                  <div className="space-y-1">
                    <Label htmlFor={`hotel-price-${row.tier}`}>Monthly price</Label>
                    <Input
                      id={`hotel-price-${row.tier}`}
                      type="number"
                      min={1}
                      step="any"
                      value={row.price}
                      onChange={(e) =>
                        setDrafts((prev) =>
                          prev.map((item) =>
                            item.tier === row.tier
                              ? { ...item, price: e.target.value }
                              : item,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`hotel-currency-${row.tier}`}>Currency</Label>
                    <Input
                      id={`hotel-currency-${row.tier}`}
                      value={row.currency}
                      onChange={(e) =>
                        setDrafts((prev) =>
                          prev.map((item) =>
                            item.tier === row.tier
                              ? { ...item, currency: e.target.value.toUpperCase() }
                              : item,
                          ),
                        )
                      }
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        <Button onClick={() => void savePrices()} disabled={saving}>
          {saving ? "Saving…" : "Save hotel plan prices"}
        </Button>
      </CardContent>
    </Card>
  );
}
