"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";
import { DEFAULT_LISTING_COUNTRY } from "@/lib/african-countries";
import { buildCountryListingsReport } from "@/lib/admin-country-report";
import { CountryListingsReportPanel } from "@/components/admin/country-listings-report";

const STATUSES = [
  "DRAFT",
  "PENDING",
  "ACTIVE",
  "SOLD",
  "RENTED",
  "EXPIRED",
  "REJECTED",
  "ARCHIVED",
] as const;

type PropertyStatus = (typeof STATUSES)[number];

interface AdminProperty {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  listingType: string;
  country?: string | null;
  county: string;
  town: string;
  status: PropertyStatus;
  isVerified: boolean;
  views: number;
  createdAt: string;
  owner: { id: string; name: string | null; email: string };
  agent: { id: string; name: string | null; email: string } | null;
}

export function AdminPropertiesManager({
  listingType,
  hideHeader = false,
  emptyHint,
}: {
  listingType?: string;
  hideHeader?: boolean;
  emptyHint?: string;
} = {}) {
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminProperty | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [countryFilter, setCountryFilter] = useState<string>("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/properties");
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not load properties");
        setProperties([]);
        return;
      }
      setProperties(json.data ?? []);
    } catch {
      toast.error("Could not load properties");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const scoped = useMemo(
    () =>
      listingType
        ? properties.filter((p) => p.listingType === listingType)
        : properties,
    [properties, listingType],
  );

  const countryReport = useMemo(
    () => buildCountryListingsReport(scoped),
    [scoped],
  );

  const countryOptions = useMemo(
    () => countryReport.byCountry.map((row) => row.country),
    [countryReport],
  );

  const filtered = useMemo(() => {
    return scoped.filter((p) => {
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      const country = p.country?.trim() || DEFAULT_LISTING_COUNTRY;
      if (countryFilter !== "ALL" && country !== countryFilter) return false;
      return true;
    });
  }, [scoped, statusFilter, countryFilter]);

  const counts = useMemo(
    () => ({
      all: scoped.length,
      active: scoped.filter((p) => p.status === "ACTIVE").length,
      pending: scoped.filter((p) => p.status === "PENDING").length,
    }),
    [scoped],
  );

  async function updateStatus(id: string, status: PropertyStatus) {
    setBusyId(id);
    const previous = properties;
    setProperties((list) =>
      list.map((p) => (p.id === id ? { ...p, status } : p)),
    );

    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const json = await res.json();
      if (!res.ok) {
        setProperties(previous);
        toast.error(json.error ?? "Status update failed");
        return;
      }
      toast.success(`Listing marked as ${status.toLowerCase()}`);
    } catch {
      setProperties(previous);
      toast.error("Status update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusyId(deleting.id);
    try {
      const res = await fetch(`/api/properties/${deleting.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Unable to delete listing");
        return;
      }
      setProperties((prev) => prev.filter((p) => p.id !== deleting.id));
      toast.success("Listing deleted permanently");
      setDeleting(null);
    } catch {
      toast.error("Unable to delete listing");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {hideHeader ? null : (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Properties</h1>
            <p className="text-muted-foreground">
              Track listings across African countries, then change status or remove
              any property on Your Home.
            </p>
          </div>
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">All {counts.all}</Badge>
        <Badge>Active {counts.active}</Badge>
        <Badge variant="outline">Pending {counts.pending}</Badge>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All countries</SelectItem>
            {countryOptions.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!loading ? <CountryListingsReportPanel report={countryReport} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>
            {listingType === "HOTEL" ? "Hotels" : "All listings"} (
            {filtered.length}
            {statusFilter !== "ALL" ? ` · ${statusFilter}` : ""})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading listings…
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {emptyHint ?? "No listings match this filter."}
            </p>
          ) : (
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Title</th>
                  <th className="pb-3 pr-4 font-medium">Price</th>
                  <th className="pb-3 pr-4 font-medium">Location</th>
                  <th className="pb-3 pr-4 font-medium">Owner</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Views</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="max-w-[200px] truncate py-3 pr-4 font-medium">
                      {p.title}
                    </td>
                    <td className="py-3 pr-4">
                      {formatPrice(p.price, { currency: p.currency })}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {[p.town, p.county, p.country || DEFAULT_LISTING_COUNTRY]
                        .filter(Boolean)
                        .join(", ")}
                    </td>
                    <td className="max-w-[160px] truncate py-3 pr-4 text-muted-foreground">
                      {p.owner.name ?? p.owner.email}
                    </td>
                    <td className="py-3 pr-4">
                      <Select
                        value={p.status}
                        disabled={busyId === p.id}
                        onValueChange={(value) =>
                          void updateStatus(p.id, value as PropertyStatus)
                        }
                      >
                        <SelectTrigger className="h-8 w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {p.views.toLocaleString()}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/properties/${p.slug}`} target="_blank">
                            <ExternalLink className="mr-1 h-3.5 w-3.5" />
                            View
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busyId === p.id}
                          onClick={() => setDeleting(p)}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(deleting)} onOpenChange={() => setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete listing?</DialogTitle>
            <DialogDescription>
              This permanently removes &ldquo;{deleting?.title}&rdquo; from the
              site. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busyId === deleting?.id}
              onClick={() => void confirmDelete()}
            >
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
