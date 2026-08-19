"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Home,
  Loader2,
  Phone,
  XCircle,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice, formatRelativeDate } from "@/lib/utils";

interface RentalReservationRow {
  id: string;
  moveInDate: string | null;
  message: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "RENTED";
  adminNotes: string | null;
  createdAt: string;
  rentalRoom?: { id: string; label: string; status: string } | null;
  property: {
    id: string;
    title: string;
    slug: string;
    price: number;
    currency: string;
    town?: string;
    county?: string;
    status: string;
  };
  tenant: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

interface RentalReservationsManagerProps {
  mode: "admin" | "owner";
}

export function RentalReservationsManager({
  mode,
}: RentalReservationsManagerProps) {
  const [reservations, setReservations] = useState<RentalReservationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState("ALL");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const [republishOpen, setRepublishOpen] = useState(false);
  const [republishReservationId, setRepublishReservationId] = useState<string | null>(null);
  const [republishReason, setRepublishReason] = useState("");
  const [republishBusy, setRepublishBusy] = useState(false);

  const apiBase =
    mode === "admin"
      ? "/api/admin/rental-reservations"
      : "/api/rental-reservations/received";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiBase);
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not load reservations");
        setReservations([]);
        return;
      }
      setReservations(json.data ?? []);
    } catch {
      toast.error("Could not load reservations");
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return reservations;
    return reservations.filter((r) => r.status === filter);
  }, [reservations, filter]);

  const pendingCount = reservations.filter((r) => r.status === "PENDING").length;

  async function updateReservation(
    id: string,
    status: "APPROVED" | "REJECTED" | "RENTED",
  ) {
    if (mode !== "admin") return;

    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/rental-reservations/${id}`, {
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

      if (status === "RENTED") {
        toast.success(
          json.message ??
            "Marked as rented — listing removed from the site",
        );
        void load();
        return;
      }

      setReservations((prev) =>
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
        status === "APPROVED" ? "Reservation approved" : "Reservation rejected",
      );
    } catch {
      toast.error("Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function requestRepublish() {
    if (!republishReservationId) return;
    setRepublishBusy(true);
    try {
      const res = await fetch("/api/rental-republish-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rentalReservationId: republishReservationId,
          reason: republishReason.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Unable to submit republish request");
        return;
      }
      toast.success(json.message ?? "Republish request sent");
      setRepublishOpen(false);
      setRepublishReservationId(null);
      setRepublishReason("");
      void load();
    } catch {
      toast.error("Unable to submit republish request");
    } finally {
      setRepublishBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Rental reservations</h1>
          <p className="text-muted-foreground">
            {mode === "admin"
              ? "Review tenant reservations and mark rentals as rented to remove them from the site."
              : "Tenants who want to rent your listed properties."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 ? (
            <Badge>{pendingCount} pending</Badge>
          ) : null}
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="RENTED">Rented</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reservations ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No rental reservations yet.
            </p>
          ) : (
            filtered.map((r) => (
              <div key={r.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/properties/${r.property.slug}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {r.property.title}
                      {r.rentalRoom?.label ? ` · ${r.rentalRoom.label}` : ""}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {r.tenant.name} ({r.tenant.email})
                      {r.tenant.phone ? ` · ${r.tenant.phone}` : ""}
                    </p>
                    <p className="text-sm">
                      {formatPrice(r.property.price, {
                        currency: r.property.currency,
                      })}
                      /month
                      {r.moveInDate
                        ? ` · Move-in ${new Date(r.moveInDate).toLocaleDateString("en-KE")}`
                        : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeDate(r.createdAt)}
                      {r.rentalRoom
                        ? r.rentalRoom.status === "RENTED"
                          ? " · Room rented"
                          : " · Room still open on listing"
                        : r.property.status === "RENTED"
                          ? " · Listing rented"
                          : ""}
                    </p>
                  </div>
                  <Badge
                    variant={
                      r.status === "PENDING"
                        ? "default"
                        : r.status === "RENTED" || r.status === "APPROVED"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {r.status}
                  </Badge>
                </div>

                {r.message ? (
                  <p className="text-sm whitespace-pre-wrap">{r.message}</p>
                ) : null}

                {r.tenant.phone ? (
                  <a
                    href={`tel:${r.tenant.phone}`}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Call tenant
                  </a>
                ) : null}

                {mode === "owner" && r.status === "RENTED" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={republishBusy}
                    onClick={() => {
                      setRepublishReservationId(r.id);
                      setRepublishReason("");
                      setRepublishOpen(true);
                    }}
                  >
                    Request republish
                  </Button>
                ) : null}

                {mode === "admin" &&
                (r.status === "PENDING" || r.status === "APPROVED") &&
                !(r.rentalRoom
                  ? r.rentalRoom.status === "RENTED"
                  : r.property.status === "RENTED") ? (
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
                        onClick={() => void updateReservation(r.id, "APPROVED")}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        disabled={busyId === r.id}
                        onClick={() => void updateReservation(r.id, "RENTED")}
                      >
                        <Home className="mr-1 h-4 w-4" />
                        Mark as rented
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === r.id}
                        onClick={() => void updateReservation(r.id, "REJECTED")}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Marking as rented removes the listing from search and rent
                      pages immediately.
                    </p>
                  </>
                ) : null}

                {mode === "admin" &&
                r.status === "APPROVED" &&
                r.property.status !== "RENTED" ? (
                  <Button
                    size="sm"
                    disabled={busyId === r.id}
                    onClick={() => void updateReservation(r.id, "RENTED")}
                  >
                    <Home className="mr-1 h-4 w-4" />
                    Mark property as rented
                  </Button>
                ) : null}

                {r.adminNotes ? (
                  <p className="text-sm text-muted-foreground">
                    Notes: {r.adminNotes}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog
        open={republishOpen}
        onOpenChange={(open) => {
          if (!open) {
            setRepublishOpen(false);
            setRepublishReservationId(null);
            setRepublishReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request republishing</DialogTitle>
            <DialogDescription>
              Use this when the tenant did not complete the move-in. The site admin
              will review and can bring the listing back.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Textarea
              placeholder="Short reason (optional) — e.g. tenant did not turn up on move-in date"
              value={republishReason}
              onChange={(e) => setRepublishReason(e.target.value)}
              rows={4}
              maxLength={2000}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRepublishOpen(false);
                setRepublishReservationId(null);
                setRepublishReason("");
              }}
              disabled={republishBusy}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void requestRepublish()}
              disabled={republishBusy || !republishReservationId}
            >
              {republishBusy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
