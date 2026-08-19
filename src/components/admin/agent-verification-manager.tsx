"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeCheck, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AgentRow {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  nationalId: string | null;
  agency: string;
  licenseNumber: string | null;
  county: string;
  listingsCount: number;
  verificationStatus: string;
  isVerified: boolean;
  image?: string | null;
  createdAt: string;
}

interface LandlordRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationalId: string | null;
  verificationStatus: string;
  nationalIdVerified: string;
  listingCount: number;
  image?: string | null;
  createdAt: string;
}

type Filter = "ALL" | "VERIFIED" | "PENDING";

export function AgentVerificationManager({
  initialAgents = [],
  initialLandlords = [],
}: {
  initialAgents?: AgentRow[];
  initialLandlords?: LandlordRow[];
}) {
  const [agents, setAgents] = useState<AgentRow[]>(initialAgents);
  const [landlords, setLandlords] = useState<LandlordRow[]>(initialLandlords);
  const [loading, setLoading] = useState(initialAgents.length === 0 && initialLandlords.length === 0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [agentFilter, setAgentFilter] = useState<Filter>("ALL");
  const [landlordFilter, setLandlordFilter] = useState<Filter>("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [agentsRes, usersRes] = await Promise.all([
        fetch("/api/admin/agents"),
        fetch("/api/admin/users"),
      ]);
      const agentsJson = await agentsRes.json();
      const usersJson = await usersRes.json();

      if (!agentsRes.ok) {
        toast.error(agentsJson.error ?? "Could not load agents");
        setAgents([]);
      } else {
        setAgents(
          ((agentsJson.data ?? []) as AgentRow[]).map((a) => ({
            ...a,
            agency: a.agency || "Independent",
            userId: (a as AgentRow & { userId?: string }).userId,
          })),
        );
      }

      if (!usersRes.ok) {
        toast.error(usersJson.error ?? "Could not load landlords");
        setLandlords([]);
      } else {
        const sellers = (
          (usersJson.data ?? []) as Array<{
            id: string;
            name: string;
            email: string;
            phone: string;
            nationalId: string | null;
            verificationStatus: string;
            nationalIdVerified: string;
            role: string;
            listingCount: number;
            image?: string | null;
            createdAt: string;
          }>
        ).filter((u) => u.role === "SELLER");

        setLandlords(
          sellers.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            nationalId: u.nationalId,
            verificationStatus: u.verificationStatus,
            nationalIdVerified: u.nationalIdVerified,
            listingCount: u.listingCount,
            image: u.image ?? null,
            createdAt: u.createdAt,
          })),
        );
      }
    } catch {
      toast.error("Could not load verification lists");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredAgents = useMemo(() => {
    if (agentFilter === "VERIFIED") return agents.filter((a) => a.isVerified);
    if (agentFilter === "PENDING") return agents.filter((a) => !a.isVerified);
    return agents;
  }, [agents, agentFilter]);

  const filteredLandlords = useMemo(() => {
    if (landlordFilter === "VERIFIED") {
      return landlords.filter(
        (l) =>
          l.verificationStatus === "VERIFIED" ||
          l.nationalIdVerified === "VERIFIED",
      );
    }
    if (landlordFilter === "PENDING") {
      return landlords.filter(
        (l) =>
          l.verificationStatus !== "VERIFIED" &&
          l.nationalIdVerified !== "VERIFIED",
      );
    }
    return landlords;
  }, [landlords, landlordFilter]);

  async function setAgentVerified(id: string, approve: boolean) {
    setBusyId(`agent-${id}`);
    const agent = agents.find((a) => a.id === id);
    const targetId = agent?.userId ?? id;
    try {
      const res = await fetch(`/api/admin/agents/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: approve }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not update agent");
        return;
      }
      toast.success(
        approve
          ? "Agent approved — Verified badge is live"
          : "Agent Verified badge removed",
      );
      void load();
    } catch {
      toast.error("Could not update agent");
    } finally {
      setBusyId(null);
    }
  }

  async function setLandlordVerified(id: string, approve: boolean) {
    setBusyId(`landlord-${id}`);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: approve }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not update landlord");
        return;
      }
      toast.success(
        approve ? "Landlord verified" : "Landlord verification removed",
      );
      void load();
    } catch {
      toast.error("Could not update landlord");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              All agents ({agents.length})
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Approve any agent for the public Verified badge.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={agentFilter}
              onValueChange={(v) => setAgentFilter(v as Filter)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void load()}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading agents…
            </div>
          ) : filteredAgents.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              No agent-role accounts yet. Most professionals register as
              landlords — see the landlords section below.
            </p>
          ) : (
            <ul className="space-y-3">
              {filteredAgents.map((agent) => (
                <li
                  key={agent.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border p-4"
                >
                  <div className="flex min-w-0 gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
                      {agent.image ? (
                        <Image
                          src={agent.image}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{agent.name}</p>
                      {agent.isVerified ? (
                        <Badge className="gap-1 bg-primary text-primary-foreground">
                          <BadgeCheck className="h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {agent.verificationStatus}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {agent.agency} · {agent.county}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {agent.email}
                      {agent.phone ? ` · ${agent.phone}` : ""}
                    </p>
                    <p className="text-xs">
                      National ID:{" "}
                      <span className="font-mono">
                        {agent.nationalId ?? "—"}
                      </span>
                      {agent.licenseNumber
                        ? ` · License: ${agent.licenseNumber}`
                        : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {agent.listingsCount} listing
                      {agent.listingsCount === 1 ? "" : "s"} · Joined{" "}
                      {new Date(agent.createdAt).toLocaleDateString("en-KE", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {agent.isVerified ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === `agent-${agent.id}`}
                        onClick={() => void setAgentVerified(agent.id, false)}
                      >
                        <XCircle className="mr-1.5 h-3.5 w-3.5" />
                        Remove badge
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={busyId === `agent-${agent.id}`}
                        onClick={() => void setAgentVerified(agent.id, true)}
                      >
                        {busyId === `agent-${agent.id}` ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <BadgeCheck className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Approve verified badge
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle>All landlords ({landlords.length})</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Review and verify every landlord / seller account.
            </p>
          </div>
          <Select
            value={landlordFilter}
            onValueChange={(v) => setLandlordFilter(v as Filter)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading landlords…
            </div>
          ) : filteredLandlords.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              No landlords found.
            </p>
          ) : (
            <ul className="space-y-3">
              {filteredLandlords.map((landlord) => {
                const verified =
                  landlord.verificationStatus === "VERIFIED" ||
                  landlord.nationalIdVerified === "VERIFIED";
                return (
                  <li
                    key={landlord.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-xl border p-4"
                  >
                    <div className="flex min-w-0 gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
                        {landlord.image ? (
                          <Image
                            src={landlord.image}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                            {landlord.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{landlord.name}</p>
                        {verified ? (
                          <Badge className="gap-1 bg-primary text-primary-foreground">
                            <BadgeCheck className="h-3 w-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {landlord.verificationStatus}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {landlord.email}
                        {landlord.phone ? ` · ${landlord.phone}` : ""}
                      </p>
                      <p className="text-xs">
                        National ID:{" "}
                        <span className="font-mono">
                          {landlord.nationalId ?? "—"}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {landlord.listingCount} listing
                        {landlord.listingCount === 1 ? "" : "s"} · Joined{" "}
                        {new Date(landlord.createdAt).toLocaleDateString(
                          "en-KE",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </p>
                    </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {verified ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === `landlord-${landlord.id}`}
                          onClick={() =>
                            void setLandlordVerified(landlord.id, false)
                          }
                        >
                          <XCircle className="mr-1.5 h-3.5 w-3.5" />
                          Remove verification
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={busyId === `landlord-${landlord.id}`}
                          onClick={() =>
                            void setLandlordVerified(landlord.id, true)
                          }
                        >
                          {busyId === `landlord-${landlord.id}` ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <BadgeCheck className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Approve verified
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
