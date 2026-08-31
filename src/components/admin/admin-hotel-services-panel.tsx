"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getHotelSection } from "@/lib/hotel-services";
import { formatPrice, formatRelativeDate } from "@/lib/utils";

type PackageRow = {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  priceFrom: number | null;
  priceTo: number | null;
  currency: string;
  category: string;
  owner?: { name: string | null; email: string } | null;
  property?: { title: string } | null;
  _count?: { requests: number };
};

type PackageDraft = {
  priceFrom: string;
  priceTo: string;
  currency: string;
};

type RequestRow = {
  id: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  organization: string | null;
  eventTitle: string | null;
  guestCount: number | null;
  roomCount: number | null;
  message: string | null;
  status: string;
  quotedAmount: number | null;
  currency: string;
  createdAt: string;
  owner?: { name: string | null; email: string } | null;
  property?: { title: string } | null;
};

function statusVariant(status: string) {
  if (status === "CONFIRMED") return "default" as const;
  if (status === "QUOTED") return "secondary" as const;
  if (status === "DECLINED" || status === "CANCELLED") return "destructive" as const;
  return "outline" as const;
}

function packageDraftFromRow(pkg: PackageRow): PackageDraft {
  return {
    priceFrom: pkg.priceFrom != null ? String(pkg.priceFrom) : "",
    priceTo: pkg.priceTo != null ? String(pkg.priceTo) : "",
    currency: pkg.currency || "KES",
  };
}

export function AdminHotelServicesPanel({ slug }: { slug: string }) {
  const section = getHotelSection(slug);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, PackageDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!section) return;
    setLoading(true);
    try {
      const cat = section.key;
      const [pkgRes, reqRes] = await Promise.all([
        section.supportsPackages
          ? fetch(`/api/hotel-packages?category=${cat}&scope=all`)
          : Promise.resolve(null),
        fetch(`/api/hotel-service-requests?category=${cat}&scope=all`),
      ]);

      if (section.supportsPackages && pkgRes) {
        const pkgJson = (await pkgRes.json()) as { success?: boolean; data?: PackageRow[] };
        if (pkgJson.success) setPackages(pkgJson.data ?? []);
      }

      const reqJson = (await reqRes.json()) as { success?: boolean; data?: RequestRow[] };
      if (reqJson.success) setRequests(reqJson.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [slug, section?.key, section?.supportsPackages]);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(pkg: PackageRow) {
    setEditingId(pkg.id);
    setDrafts((prev) => ({ ...prev, [pkg.id]: packageDraftFromRow(pkg) }));
  }

  function cancelEdit(id: string) {
    setEditingId((current) => (current === id ? null : current));
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function savePackagePrices(id: string) {
    const draft = drafts[id];
    if (!draft) return;

    const priceFrom = draft.priceFrom.trim() ? Number(draft.priceFrom) : null;
    const priceTo = draft.priceTo.trim() ? Number(draft.priceTo) : null;

    if (draft.priceFrom.trim() && Number.isNaN(priceFrom)) {
      toast.error("Enter a valid starting price");
      return;
    }
    if (draft.priceTo.trim() && Number.isNaN(priceTo)) {
      toast.error("Enter a valid maximum price");
      return;
    }
    if (priceFrom != null && priceTo != null && priceTo < priceFrom) {
      toast.error("Maximum price cannot be less than starting price");
      return;
    }

    setSavingId(id);
    try {
      const res = await fetch(`/api/hotel-packages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceFrom,
          priceTo,
          currency: draft.currency.trim() || "KES",
        }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Could not update package prices");
        return;
      }
      toast.success("Package prices updated");
      setEditingId(null);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await load();
    } catch {
      toast.error("Could not update package prices");
    } finally {
      setSavingId(null);
    }
  }

  if (!section) {
    return (
      <p className="text-sm text-muted-foreground">Unknown hotel service section.</p>
    );
  }

  const Icon = section.icon;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{section.label}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{section.headline}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Site-wide admin view — all operators on Your Home.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {section.supportsPackages ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Published packages ({packages.length})</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading packages…</p>
          ) : packages.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No packages published in this category yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {packages.map((pkg) => {
                const isEditing = editingId === pkg.id;
                const draft = drafts[pkg.id] ?? packageDraftFromRow(pkg);

                return (
                <Card key={pkg.id}>
                  <CardContent className="py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{pkg.title}</p>
                          <Badge variant={pkg.isActive ? "default" : "secondary"}>
                            {pkg.isActive ? "Live" : "Paused"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {pkg.owner?.name ?? "Operator"} · {pkg.owner?.email}
                          {pkg.property ? ` · ${pkg.property.title}` : ""}
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm">{pkg.description}</p>
                        {!isEditing && pkg.priceFrom != null ? (
                          <p className="mt-2 text-sm font-medium">
                            From {formatPrice(pkg.priceFrom, { currency: pkg.currency })}
                            {pkg.priceTo != null
                              ? ` – ${formatPrice(pkg.priceTo, { currency: pkg.currency })}`
                              : ""}
                          </p>
                        ) : null}
                        {!isEditing && pkg.priceFrom == null ? (
                          <p className="mt-2 text-sm text-muted-foreground">No price set</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {(pkg._count?.requests ?? 0) > 0 ? (
                          <Badge variant="outline">{pkg._count?.requests} requests</Badge>
                        ) : null}
                        {!isEditing ? (
                          <Button variant="outline" size="sm" onClick={() => startEdit(pkg)}>
                            Edit prices
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="mt-4 space-y-3 rounded-lg border bg-muted/30 p-4">
                        <p className="text-sm font-medium">Edit package prices</p>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="space-y-2">
                            <Label htmlFor={`price-from-${pkg.id}`}>From</Label>
                            <Input
                              id={`price-from-${pkg.id}`}
                              type="number"
                              min={0}
                              step="any"
                              placeholder="Starting price"
                              value={draft.priceFrom}
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [pkg.id]: { ...draft, priceFrom: e.target.value },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`price-to-${pkg.id}`}>To (optional)</Label>
                            <Input
                              id={`price-to-${pkg.id}`}
                              type="number"
                              min={0}
                              step="any"
                              placeholder="Maximum price"
                              value={draft.priceTo}
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [pkg.id]: { ...draft, priceTo: e.target.value },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`currency-${pkg.id}`}>Currency</Label>
                            <Input
                              id={`currency-${pkg.id}`}
                              placeholder="KES"
                              value={draft.currency}
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [pkg.id]: { ...draft, currency: e.target.value.toUpperCase() },
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            disabled={savingId === pkg.id}
                            onClick={() => void savePackagePrices(pkg.id)}
                          >
                            {savingId === pkg.id ? "Saving…" : "Save prices"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={savingId === pkg.id}
                            onClick={() => cancelEdit(pkg.id)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
              })}
            </div>
          )}
        </div>
      ) : null}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          {section.key === "EVENT_BOOKING_REQUEST" ? "Event requests" : "Booking requests"} (
          {requests.length})
        </h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading requests…</p>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No requests in this category yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <Card key={req.id}>
                <CardContent className="space-y-3 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{req.contactName}</p>
                        <Badge variant={statusVariant(req.status)}>{req.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {req.owner?.name ?? "Operator"} · {req.owner?.email} ·{" "}
                        {formatRelativeDate(req.createdAt)}
                      </p>
                      {req.organization ? (
                        <p className="text-sm text-muted-foreground">{req.organization}</p>
                      ) : null}
                      {req.eventTitle ? (
                        <p className="text-sm font-medium">{req.eventTitle}</p>
                      ) : null}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {req.contactPhone ? <p>{req.contactPhone}</p> : null}
                      {req.contactEmail ? <p>{req.contactEmail}</p> : null}
                    </div>
                  </div>
                  {(req.guestCount || req.roomCount) && (
                    <p className="text-sm">
                      {req.guestCount ? `${req.guestCount} guests` : ""}
                      {req.guestCount && req.roomCount ? " · " : ""}
                      {req.roomCount ? `${req.roomCount} rooms` : ""}
                    </p>
                  )}
                  {req.message ? (
                    <p className="rounded-md bg-muted/50 p-3 text-sm">{req.message}</p>
                  ) : null}
                  {req.quotedAmount != null ? (
                    <p className="text-sm font-medium">
                      Quote: {formatPrice(req.quotedAmount, { currency: req.currency })}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
