"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface AgentReportRow {
  id: string;
  reason: string;
  details: string | null;
  status: "PENDING" | "REVIEWED" | "DISMISSED";
  adminNotes: string | null;
  createdAt: string;
  agent: { id: string; name: string; email: string };
  reporter: { id: string; name: string; email: string };
}

const REASON_LABELS: Record<string, string> = {
  FRAUD: "Fraud or scam",
  HARASSMENT: "Harassment",
  MISLEADING: "Misleading info",
  UNRESPONSIVE: "Unresponsive",
  OTHER: "Other",
};

export function ReportedAccountsManager() {
  const [reports, setReports] = useState<AgentReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/agent-reports");
      const json = await res.json();
      if (!res.ok) {
        const message =
          json.error ??
          (res.status === 500
            ? "Database may need migration — run npx prisma migrate deploy"
            : "Could not load reports");
        setLoadError(message);
        toast.error(message);
        setReports([]);
        return;
      }
      setReports(json.data ?? []);
    } catch {
      const message = "Could not load reported accounts";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(id: string, status: "REVIEWED" | "DISMISSED") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/agent-reports/${id}`, {
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
      setReports((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status,
                adminNotes: notes[id]?.trim() || r.adminNotes,
              }
            : r,
        ),
      );
      toast.success(
        status === "REVIEWED" ? "Report marked reviewed" : "Report dismissed",
      );
    } catch {
      toast.error("Update failed");
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = reports.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reported accounts</h1>
          <p className="text-muted-foreground">
            Customer reports about agents — review and take action.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 ? (
            <Badge>{pendingCount} pending</Badge>
          ) : null}
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Agent reports ({reports.length}
            {pendingCount > 0 ? ` · ${pendingCount} need review` : ""})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading reported accounts…
            </div>
          ) : loadError ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-muted-foreground">{loadError}</p>
              <Button className="mt-4" variant="outline" onClick={() => void load()}>
                Try again
              </Button>
            </div>
          ) : reports.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">
              No reported accounts yet. Customers can report agents from any
              agent profile page.
            </p>
          ) : (
            reports.map((r) => (
              <div
                key={r.id}
                className="space-y-3 rounded-lg border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {REASON_LABELS[r.reason] ?? r.reason} ·{" "}
                      <Link
                        href={`/agents/${r.agent.id}`}
                        className="text-primary hover:underline"
                      >
                        {r.agent.name}
                      </Link>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Reported by {r.reporter.name} ({r.reporter.email}) ·{" "}
                      {new Date(r.createdAt).toLocaleString("en-KE")}
                    </p>
                  </div>
                  <Badge
                    variant={
                      r.status === "PENDING"
                        ? "default"
                        : r.status === "REVIEWED"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {r.status}
                  </Badge>
                </div>

                {r.details ? (
                  <p className="text-sm whitespace-pre-wrap">{r.details}</p>
                ) : null}

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
                        onClick={() => void review(r.id, "REVIEWED")}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Mark reviewed
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === r.id}
                        onClick={() => void review(r.id, "DISMISSED")}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Dismiss
                      </Button>
                    </div>
                  </>
                ) : r.adminNotes ? (
                  <p className="text-sm text-muted-foreground">
                    Admin notes: {r.adminNotes}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
