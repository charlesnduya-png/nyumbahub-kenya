"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

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
  image?: string | null;
  isFeatured: boolean;
  isVerified: boolean;
  verificationStatus: string;
  createdAt: string;
}

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<AdminAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

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
      setAgents(json.data ?? []);
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
    patch: { isFeatured?: boolean; isVerified?: boolean },
  ) {
    setBusyId(id);
    const previous = agents;
    setAgents((list) =>
      list.map((a) => (a.id === id ? { ...a, ...patch } : a)),
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
      }
      void load();
    } catch {
      setAgents(previous);
      toast.error("Update failed");
    } finally {
      setBusyId(null);
    }
  }

  const featuredCount = agents.filter((a) => a.isFeatured).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Featured agents</h1>
          <p className="text-muted-foreground">
            Choose which agents appear on the homepage. To verify accounts, use{" "}
            <Link
              href="/dashboard/admin/verification"
              className="font-medium text-primary hover:underline"
            >
              Verify accounts
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
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Agent</th>
                  <th className="pb-3 pr-4 font-medium">Contact</th>
                  <th className="pb-3 pr-4 font-medium">Agency</th>
                  <th className="pb-3 pr-4 font-medium">Listings</th>
                  <th className="pb-3 pr-4 font-medium">Verified</th>
                  <th className="pb-3 font-medium">Homepage featured</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
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
                      {a.listingsCount}
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {a.rating} ({a.reviewCount})
                      </p>
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
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
