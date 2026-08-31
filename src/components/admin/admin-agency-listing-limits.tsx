"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { AgencyPlanDefinition } from "@/lib/agency-plans";
import { formatAgencyListingCap } from "@/lib/agency-plans";

type DraftRow = {
  tier: string;
  name: string;
  maxListings: string;
  unlimited: boolean;
  popular?: boolean;
};

function draftsFromPlans(plans: AgencyPlanDefinition[]): DraftRow[] {
  return plans.map((plan) => ({
    tier: plan.id,
    name: plan.name,
    maxListings: plan.maxListings == null ? "" : String(plan.maxListings),
    unlimited: plan.maxListings == null,
    popular: plan.popular,
  }));
}

export function AdminAgencyListingLimits({
  initialPlans,
}: {
  initialPlans: AgencyPlanDefinition[];
}) {
  const [drafts, setDrafts] = useState<DraftRow[]>(() => draftsFromPlans(initialPlans));
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    const res = await fetch("/api/admin/agency-plans/listing-limits");
    const json = (await res.json()) as {
      success?: boolean;
      data?: AgencyPlanDefinition[];
    };
    if (json.success && json.data) {
      setDrafts(draftsFromPlans(json.data));
    }
  }, []);

  useEffect(() => {
    setDrafts(draftsFromPlans(initialPlans));
  }, [initialPlans]);

  async function saveLimits() {
    setSaving(true);
    try {
      const limits = drafts.map((row) => ({
        tier: row.tier,
        maxListings:
          row.tier === "ENTERPRISE" && row.unlimited
            ? null
            : row.unlimited
              ? null
              : Number(row.maxListings),
      }));

      for (const row of limits) {
        if (row.tier === "FREE" && (row.maxListings == null || Number.isNaN(row.maxListings))) {
          toast.error("Free tier needs a numeric listing cap");
          return;
        }
        if (
          row.tier !== "FREE" &&
          row.maxListings != null &&
          (Number.isNaN(row.maxListings) || row.maxListings < 0)
        ) {
          toast.error(`Enter a valid cap for ${row.tier}`);
          return;
        }
      }

      const res = await fetch("/api/admin/agency-plans/listing-limits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limits }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Could not save listing limits");
        return;
      }

      toast.success("Agency listing limits updated");
      await reload();
    } catch {
      toast.error("Could not save listing limits");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Agency listing limits</CardTitle>
        <p className="text-sm text-muted-foreground">
          Set how many active listings agents can post on each plan tier. Changes apply
          immediately to new listings and free-tier accounts.
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
                <div className="space-y-1">
                  <Label htmlFor={`agency-limit-${row.tier}`}>Active listings</Label>
                  <Input
                    id={`agency-limit-${row.tier}`}
                    type="number"
                    min={0}
                    value={row.maxListings}
                    onChange={(e) =>
                      setDrafts((prev) =>
                        prev.map((item) =>
                          item.tier === row.tier
                            ? { ...item, maxListings: e.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor={`agency-unlimited-${row.tier}`}>Unlimited</Label>
                    <Switch
                      id={`agency-unlimited-${row.tier}`}
                      checked={row.unlimited}
                      onCheckedChange={(checked) =>
                        setDrafts((prev) =>
                          prev.map((item) =>
                            item.tier === row.tier
                              ? { ...item, unlimited: checked }
                              : item,
                          ),
                        )
                      }
                    />
                  </div>
                  {!row.unlimited ? (
                    <div className="space-y-1">
                      <Label htmlFor={`agency-limit-${row.tier}`}>Active listings</Label>
                      <Input
                        id={`agency-limit-${row.tier}`}
                        type="number"
                        min={1}
                        value={row.maxListings}
                        onChange={(e) =>
                          setDrafts((prev) =>
                            prev.map((item) =>
                              item.tier === row.tier
                                ? { ...item, maxListings: e.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {formatAgencyListingCap(null)}
                    </p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        <Button onClick={() => void saveLimits()} disabled={saving}>
          {saving ? "Saving…" : "Save agency listing limits"}
        </Button>
      </CardContent>
    </Card>
  );
}
