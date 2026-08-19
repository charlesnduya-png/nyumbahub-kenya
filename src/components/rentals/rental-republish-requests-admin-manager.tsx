"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RepublishStatus = "PENDING" | "APPROVED" | "REJECTED";

interface RepublishRequestRow {
  id: string;
  property: { id: string; title: string; slug: string };
  requester: { id: string; name: string; email: string | null };
  agent: { id: string; name: string; email: string | null } | null;
  tenant: { id: string; name: string; email: string | null; phone: string | null };
  reason: string | null;
  status: RepublishStatus;
  adminNotes: string | null;
  createdAt: string;
}

export function RentalRepublishRequestsAdminManager() {
  const [requests, setRequests] = useState<RepublishRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<RepublishStatus | "ALL">("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/rental-republish-requests");
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not load requests");
        setRequests([]);
        return;
      }
      setRequests(json.data ?? []);
    } catch {
      toast.error("Could not load requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = requests.filter((r) => (filter === "ALL" ? true : r.status === filter));

  async function update(id: string, status: "APPROVED" | "REJECTED") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/rental-republish-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminNotes: notes[id]?.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Update failed");
        return;
      }
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status, adminNotes: notes[id]?.trim() || r.adminNotes } : r,
        ),
      );
      toast.success(status === "APPROVED" ? "Republish approved" : "Republish rejected");
    } catch {
      toast.error("Update failed");
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Rental republish requests</h1>
          <p className="text-muted-foreground">
            Agents request republishing when a tenant fails to move in.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 ? <Badge>{pendingCount} pending</Badge> : null}
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as RepublishStatus | "ALL")}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Requests ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 py-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">
              No rental republish requests.
            </p>
          ) : (
            filtered.map((r) => (
              <div key={r.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{r.property.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Requested by {r.requester.name} · Tenant {r.tenant.name}
                    </p>
                    {r.reason ? (
                      <p className="text-sm whitespace-pre-wrap">{r.reason}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString("en-KE")}
                    </p>
                  </div>
                  <Badge variant={r.status === "PENDING" ? "default" : r.status === "APPROVED" ? "secondary" : "outline"}>
                    {r.status}
                  </Badge>
                </div>

                {r.status === "PENDING" ? (
                  <>
                    <Textarea
                      placeholder="Admin notes (optional)"
                      value={notes[r.id] ?? ""}
                      onChange={(e) =>
                        setNotes((prev) => ({
                          ...prev,
                          [r.id]: e.target.value,
                        }))
                      }
                      rows={2}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={busyId === r.id}
                        onClick={() => void update(r.id, "APPROVED")}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === r.id}
                        onClick={() => void update(r.id, "REJECTED")}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </>
                ) : r.adminNotes ? (
                  <p className="text-sm text-muted-foreground">Notes: {r.adminNotes}</p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

