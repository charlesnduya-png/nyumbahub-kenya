"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

interface AdminAgent {
  id: string;
  name: string;
  agency: string;
  county: string;
  rating: number;
  reviewCount: number;
  listingsCount: number;
  image?: string | null;
  isFeatured: boolean;
  isVerified: boolean;
  slug?: string;
  specialties?: string[];
}

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<AdminAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [source, setSource] = useState("");

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
      setSource(json.source ?? "");
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
    patch: { isFeatured?: boolean; isVerified?: boolean },
  ) {
    setBusyId(id);
    const previous = agents;
    setAgents((list) =>
      list.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );

    try {
      const res = await fetch(`/api/admin/agents/${id}`, {
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
          <h1 className="text-2xl font-bold">Agents</h1>
          <p className="text-muted-foreground">
            Verify agents and choose who appears in Homepage → Featured Agents.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      </div>

      {source === "demo" && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          Demo mode: featured toggles are stored in memory until the server
          restarts. Connect Postgres to persist them.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Registered agents · {featuredCount} featured on homepage
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
              No agents registered yet.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Agent</th>
                  <th className="pb-3 pr-4 font-medium">Agency</th>
                  <th className="pb-3 pr-4 font-medium">County</th>
                  <th className="pb-3 pr-4 font-medium">Rating</th>
                  <th className="pb-3 pr-4 font-medium">Listings</th>
                  <th className="pb-3 pr-4 font-medium">Verified</th>
                  <th className="pb-3 font-medium">Homepage featured</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
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
                          {a.isFeatured ? (
                            <Badge variant="secondary" className="mt-0.5 text-[10px]">
                              On homepage
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">{a.agency}</td>
                    <td className="py-3 pr-4">{a.county}</td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {a.rating} ({a.reviewCount})
                      </span>
                    </td>
                    <td className="py-3 pr-4">{a.listingsCount}</td>
                    <td className="py-3 pr-4">
                      <Switch
                        checked={a.isVerified}
                        disabled={busyId === a.id}
                        onCheckedChange={(checked) =>
                          void updateAgent(a.id, { isVerified: checked })
                        }
                        aria-label={`Verify ${a.name}`}
                      />
                    </td>
                    <td className="py-3">
                      <Switch
                        checked={a.isFeatured}
                        disabled={busyId === a.id}
                        onCheckedChange={(checked) =>
                          void updateAgent(a.id, { isFeatured: checked })
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
