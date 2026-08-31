"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { UNLIMITED_LISTING_OVERRIDE } from "@/lib/agency-plan-limits";

interface AdminAgent {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  nationalId: string | null;
  nationalIdVerified: string;
  agency: string;
  licenseNumber: string | null;
  county: string;
  rating: number;
  reviewCount: number;
  listingsCount: number;
  listingUsed: number;
  listingLimit: number | null;
  listingLimitOverride: number | null;
  listingUnlimited: boolean;
  image?: string | null;
  isFeatured: boolean;
  isVerified: boolean;
  verificationStatus: string;
  createdAt: string;
}

function formatLimit(limit: number | null, unlimited: boolean) {
  if (unlimited || limit == null) return "Unlimited";
  return String(limit);
}

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<AdminAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [draftLimits, setDraftLimits] = useState<
    Record<string, { value: string; unlimited: boolean; useOverride: boolean }>
  >({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/agents");
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not load agents");
        setAgents([]);
        return;
      }
      const rows = (json.data ?? []) as AdminAgent[];
      setAgents(rows);
      setDraftLimits(
        Object.fromEntries(
          rows.map((a) => [
            a.userId,
            {
              value:
                a.listingLimitOverride != null &&
                a.listingLimitOverride !== UNLIMITED_LISTING_OVERRIDE
                  ? String(a.listingLimitOverride)
                  : "",
              unlimited: a.listingLimitOverride === UNLIMITED_LISTING_OVERRIDE,
              useOverride: a.listingLimitOverride != null,
            },
          ]),
        ),
      );
    } catch {
      toast.error("Could not load agents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateAgent(
    id: string,
    userId: string,
    patch: {
      isFeatured?: boolean;
      isVerified?: boolean;
      listingLimitOverride?: number | null;
    },
  ) {
    setBusyId(id);
    const previous = agents;
    setAgents((list) =>
      list.map((a) =>
        a.userId === userId
          ? {
              ...a,
              ...("isFeatured" in patch ? { isFeatured: patch.isFeatured! } : {}),
              ...("isVerified" in patch ? { isVerified: patch.isVerified! } : {}),
              ...("listingLimitOverride" in patch
                ? { listingLimitOverride: patch.listingLimitOverride ?? null }
                : {}),
            }
          : a,
      ),
    );

    try {
      const res = await fetch(`/api/admin/agents/${userId || id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!res.ok) {
        setAgents(previous);
        toast.error(json.error ?? "Update failed");
        return;
      }

      if (typeof patch.isFeatured === "boolean") {
        toast.success(
          patch.isFeatured
            ? "Agent added to homepage Featured Agents"
            : "Agent removed from homepage Featured Agents",
        );
      } else if (typeof patch.isVerified === "boolean") {
        toast.success(
          patch.isVerified ? "Agent marked verified" : "Verification removed",
        );
      } else if ("listingLimitOverride" in patch) {
        toast.success("Agent listing limit updated");
      }
      void load();
    } catch {
      setAgents(previous);
      toast.error("Update failed");
    } finally {
      setBusyId(null);
    }
  }

  function saveListingLimit(agent: AdminAgent) {
    const draft = draftLimits[agent.userId];
    if (!draft?.useOverride) {
      void updateAgent(agent.id, agent.userId, { listingLimitOverride: null });
      return;
    }
    if (draft.unlimited) {
      void updateAgent(agent.id, agent.userId, {
        listingLimitOverride: UNLIMITED_LISTING_OVERRIDE,
      });
      return;
    }
    const value = Number(draft.value);
    if (Number.isNaN(value) || value < 0) {
      toast.error("Enter a valid listing number");
      return;
    }
    void updateAgent(agent.id, agent.userId, { listingLimitOverride: value });
  }

  const featuredCount = agents.filter((a) => a.isFeatured).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Agents</h1>
          <p className="text-muted-foreground">
            Feature agents on the homepage, verify accounts, and set how many listings
            each agent can post. Plan defaults are managed under{" "}
            <Link
              href="/dashboard/admin/subscriptions"
              className="font-medium text-primary hover:underline"
            >
              Subscriptions
            </Link>
            .
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Agent accounts ({agents.length}) · {featuredCount} on homepage
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading agents…
            </div>
          ) : agents.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">
              No agent-role accounts yet. Most professionals register as
              landlords — verify them under{" "}
              <Link
                href="/dashboard/admin/verification"
                className="font-medium text-primary hover:underline"
              >
                Verify accounts
              </Link>
              .
            </p>
          ) : (
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Agent</th>
                  <th className="pb-3 pr-4 font-medium">Contact</th>
                  <th className="pb-3 pr-4 font-medium">Agency</th>
                  <th className="pb-3 pr-4 font-medium">Listings</th>
                  <th className="pb-3 pr-4 font-medium">Listing limit</th>
                  <th className="pb-3 pr-4 font-medium">Verified</th>
                  <th className="pb-3 font-medium">Homepage featured</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => {
                  const draft = draftLimits[a.userId] ?? {
                    value: "",
                    unlimited: false,
                    useOverride: false,
                  };
                  return (
                    <tr key={a.id} className="border-b last:border-0 align-top">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                            {a.image ? (
                              <Image
                                src={a.image}
                                alt=""
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium">{a.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {a.county}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-xs">{a.email}</p>
                        <p className="text-xs text-muted-foreground">{a.phone}</p>
                      </td>
                      <td className="py-3 pr-4">{a.agency}</td>
                      <td className="py-3 pr-4">
                        {a.listingUsed} active
                        <p className="text-xs text-muted-foreground">
                          Effective cap: {formatLimit(a.listingLimit, a.listingUnlimited)}
                        </p>
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {a.rating} ({a.reviewCount})
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="space-y-2 min-w-[180px]">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground">
                              Custom limit
                            </span>
                            <Switch
                              checked={draft.useOverride}
                              disabled={busyId === a.id}
                              onCheckedChange={(checked) =>
                                setDraftLimits((prev) => ({
                                  ...prev,
                                  [a.userId]: {
                                    ...draft,
                                    useOverride: checked,
                                  },
                                }))
                              }
                              aria-label={`Custom listing limit for ${a.name}`}
                            />
                          </div>
                          {draft.useOverride ? (
                            <>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-muted-foreground">
                                  Unlimited
                                </span>
                                <Switch
                                  checked={draft.unlimited}
                                  disabled={busyId === a.id}
                                  onCheckedChange={(checked) =>
                                    setDraftLimits((prev) => ({
                                      ...prev,
                                      [a.userId]: {
                                        ...draft,
                                        unlimited: checked,
                                      },
                                    }))
                                  }
                                />
                              </div>
                              {!draft.unlimited ? (
                                <Input
                                  type="number"
                                  min={0}
                                  placeholder="e.g. 50"
                                  value={draft.value}
                                  disabled={busyId === a.id}
                                  onChange={(e) =>
                                    setDraftLimits((prev) => ({
                                      ...prev,
                                      [a.userId]: {
                                        ...draft,
                                        value: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              ) : null}
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busyId === a.id}
                                onClick={() => saveListingLimit(a)}
                              >
                                Save limit
                              </Button>
                            </>
                          ) : (
                            <Badge variant="secondary">Uses plan default</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Switch
                          checked={a.isVerified}
                          disabled={busyId === a.id}
                          onCheckedChange={(checked) =>
                            void updateAgent(a.id, a.userId, {
                              isVerified: checked,
                            })
                          }
                          aria-label={`Verify ${a.name}`}
                        />
                      </td>
                      <td className="py-3">
                        <Switch
                          checked={a.isFeatured}
                          disabled={busyId === a.id}
                          onCheckedChange={(checked) =>
                            void updateAgent(a.id, a.userId, {
                              isFeatured: checked,
                            })
                          }
                          aria-label={`Feature ${a.name} on homepage`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
