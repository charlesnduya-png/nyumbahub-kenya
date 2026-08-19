"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { kenyaMonthLabel, shiftKenyaMonth } from "@/lib/kenya-calendar";
import { formatPrice } from "@/lib/utils";

type LedgerRow = {
  propertyId: string;
  title: string;
  slug: string;
  unitLabel: string | null;
  unitFloor: string | null;
  plotName: string | null;
  location: string;
  currency: string;
  amountDue: number;
  amountPaid: number;
  status: "PAID" | "UNPAID";
  paidAt: string | null;
  tenant: { id: string; name: string; email: string; phone: string | null } | null;
};

type Summary = {
  rented: number;
  paid: number;
  unpaid: number;
  collected: number;
  outstanding: number;
};

function houseLabel(row: LedgerRow) {
  return row.unitLabel || row.title;
}

export function RentLedger({ compact = false }: { compact?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [canWrite, setCanWrite] = useState(false);
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<LedgerRow[]>([]);

  const load = useCallback(async (nextYear?: number, nextMonth?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (nextYear && nextMonth) {
        params.set("year", String(nextYear));
        params.set("month", String(nextMonth));
      }
      const res = await fetch(`/api/rentals/ledger?${params.toString()}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (!compact) toast.error(json.error ?? "Could not load rent");
        setRows([]);
        setSummary(null);
        return;
      }
      setYear(json.year);
      setMonth(json.month);
      setCanWrite(Boolean(json.canWrite));
      setSummary(json.summary ?? null);
      setRows(json.data ?? []);
    } catch {
      if (!compact) toast.error("Could not load rent");
      setRows([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [compact]);

  useEffect(() => {
    void load();
  }, [load]);

  async function mark(row: LedgerRow, status: "PAID" | "UNPAID") {
    if (!canWrite || year == null || month == null) return;
    setBusyId(row.propertyId);
    try {
      const res = await fetch("/api/rentals/ledger", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: row.propertyId,
          year,
          month,
          status,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Could not update rent");
        return;
      }
      toast.success(status === "PAID" ? "Marked as paid" : "Marked as not paid");
      await load(year, month);
    } catch {
      toast.error("Could not update rent");
    } finally {
      setBusyId(null);
    }
  }

  function changeMonth(delta: number) {
    if (year == null || month == null) return;
    const next = shiftKenyaMonth(year, month, delta);
    void load(next.year, next.month);
  }

  const paid = rows.filter((row) => row.status === "PAID");
  const unpaid = rows.filter((row) => row.status === "UNPAID");
  const label =
    year != null && month != null ? kenyaMonthLabel(year, month) : "This month";

  if (compact) {
    return (
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5" />
            Rent this month
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/pro/rent">Open rent board</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading rent…
            </p>
          ) : !summary || summary.rented === 0 ? (
            <p className="text-sm text-muted-foreground">
              No rented houses yet. When a unit is marked rented, it appears here
              so you can see who has paid this month.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="mt-1 text-2xl font-bold">{summary.paid}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Not paid</p>
                <p className="mt-1 text-2xl font-bold">{summary.unpaid}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Collected</p>
                <p className="mt-1 text-2xl font-bold">
                  {formatPrice(summary.collected)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Rent management</h1>
          <p className="text-muted-foreground">
            See which rented houses have paid monthly rent and which have not.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => changeMonth(-1)}
            disabled={loading || year == null}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="min-w-40 text-center text-sm font-medium">{label}</p>
          <Button
            variant="outline"
            size="icon"
            onClick={() => changeMonth(1)}
            disabled={loading || year == null}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Rented houses</p>
              <p className="mt-1 text-2xl font-bold">{summary.rented}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="mt-1 text-2xl font-bold">{summary.paid}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Not paid</p>
              <p className="mt-1 text-2xl font-bold">{summary.unpaid}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Outstanding</p>
              <p className="mt-1 text-2xl font-bold">
                {formatPrice(summary.outstanding)}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {loading ? (
        <p className="flex items-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading rent…
        </p>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No rented houses for {label}. Occupied units from Boma yangu appear
            here once they are marked rented.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <RentColumn
            title="Not paid"
            empty="Every rented house has paid this month."
            rows={unpaid}
            canWrite={canWrite}
            busyId={busyId}
            onMark={mark}
            paid={false}
          />
          <RentColumn
            title="Paid"
            empty="No payments recorded this month yet."
            rows={paid}
            canWrite={canWrite}
            busyId={busyId}
            onMark={mark}
            paid
          />
        </div>
      )}
    </div>
  );
}

function RentColumn({
  title,
  empty,
  rows,
  canWrite,
  busyId,
  onMark,
  paid,
}: {
  title: string;
  empty: string;
  rows: LedgerRow[];
  canWrite: boolean;
  busyId: string | null;
  onMark: (row: LedgerRow, status: "PAID" | "UNPAID") => void;
  paid: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          {title}
          <Badge variant={paid ? "secondary" : "outline"}>{rows.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          rows.map((row) => (
            <div key={row.propertyId} className="rounded-md border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{houseLabel(row)}</p>
                  <p className="text-xs text-muted-foreground">
                    {[row.plotName, row.unitFloor, row.location]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="mt-1 text-sm">
                    {row.tenant?.name ?? "Tenant not linked"}
                    {row.tenant?.phone ? ` · ${row.tenant.phone}` : ""}
                  </p>
                  <p className="text-sm font-medium">
                    {formatPrice(paid ? row.amountPaid : row.amountDue, {
                      currency: row.currency,
                    })}
                  </p>
                </div>
                {canWrite ? (
                  <Button
                    size="sm"
                    variant={paid ? "outline" : "default"}
                    disabled={busyId === row.propertyId}
                    onClick={() => onMark(row, paid ? "UNPAID" : "PAID")}
                  >
                    {busyId === row.propertyId
                      ? "Saving…"
                      : paid
                        ? "Mark not paid"
                        : "Mark paid"}
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
