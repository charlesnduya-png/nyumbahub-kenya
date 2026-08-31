"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { HotelServiceSection } from "@/lib/hotel-services";
import { canCreateHotelPackages, formatHotelPackageCap, isHotelSectionMuted } from "@/lib/hotel-plans";
import type { HotelPlanUsage } from "@/lib/hotel-plan-server";
import { HotelPlanMutedBanner } from "@/components/professional/hotel-plan-muted-banner";
import { formatPrice, formatRelativeDate } from "@/lib/utils";

type PackageRow = {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  priceFrom: number | null;
  priceTo: number | null;
  currency: string;
  minGuests: number | null;
  minRooms: number | null;
  validUntil: string | null;
  _count?: { requests: number };
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
  ownerNote: string | null;
  createdAt: string;
  property?: { title: string; slug: string } | null;
};

const REQUEST_STATUSES = [
  "NEW",
  "REVIEWING",
  "QUOTED",
  "CONFIRMED",
  "DECLINED",
  "CANCELLED",
] as const;

function statusVariant(status: string) {
  if (status === "CONFIRMED") return "default" as const;
  if (status === "QUOTED") return "secondary" as const;
  if (status === "DECLINED" || status === "CANCELLED") return "destructive" as const;
  return "outline" as const;
}

export function HotelServicesPanel({ section }: { section: HotelServiceSection }) {
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [minGuests, setMinGuests] = useState("");
  const [minRooms, setMinRooms] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [quotes, setQuotes] = useState<Record<string, string>>({});
  const [actingId, setActingId] = useState<string | null>(null);
  const [usage, setUsage] = useState<HotelPlanUsage | null>(null);

  const sectionMuted = usage ? isHotelSectionMuted(usage.tier, section.key) : false;
  const packagesMuted = usage ? !canCreateHotelPackages(usage.tier) : true;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cat = section.key;
      const [planRes, pkgRes, reqRes] = await Promise.all([
        fetch("/api/hotel-plans/mine"),
        section.supportsPackages
          ? fetch(`/api/hotel-packages?category=${cat}`)
          : Promise.resolve(null),
        fetch(`/api/hotel-service-requests?category=${cat}`),
      ]);

      const planJson = (await planRes.json()) as {
        success?: boolean;
        data?: { usage: HotelPlanUsage };
      };
      if (planJson.success && planJson.data) setUsage(planJson.data.usage);

      if (section.supportsPackages && pkgRes) {
        const pkgJson = (await pkgRes.json()) as { success?: boolean; data?: PackageRow[] };
        if (pkgJson.success) setPackages(pkgJson.data ?? []);
      }

      const reqJson = (await reqRes.json()) as { success?: boolean; data?: RequestRow[] };
      if (reqJson.success) setRequests(reqJson.data ?? []);
    } catch {
      toast.error("Could not load hotel data");
    } finally {
      setLoading(false);
    }
  }, [section.key, section.supportsPackages]);

  useEffect(() => {
    void load();
  }, [load]);

  const createPackage = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Title and description required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/hotel-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: section.key,
          title,
          description,
          priceFrom: priceFrom ? Number(priceFrom) : null,
          minGuests: minGuests ? Number(minGuests) : null,
          minRooms: minRooms ? Number(minRooms) : null,
        }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Could not create package");
        return;
      }
      toast.success("Package published");
      setShowForm(false);
      setTitle("");
      setDescription("");
      setPriceFrom("");
      setMinGuests("");
      setMinRooms("");
      void load();
    } catch {
      toast.error("Could not create package");
    } finally {
      setSaving(false);
    }
  };

  const togglePackage = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/hotel-packages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      const json = (await res.json()) as { success?: boolean };
      if (json.success) void load();
    } catch {
      toast.error("Could not update package");
    }
  };

  const updateRequest = async (
    id: string,
    status: (typeof REQUEST_STATUSES)[number],
  ) => {
    setActingId(id);
    try {
      const res = await fetch(`/api/hotel-service-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          ownerNote: notes[id] || null,
          quotedAmount: quotes[id] ? Number(quotes[id]) : undefined,
        }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Could not update request");
        return;
      }
      toast.success("Request updated");
      void load();
    } catch {
      toast.error("Could not update request");
    } finally {
      setActingId(null);
    }
  };

  const Icon = section.icon;

  return (
    <div className="space-y-6">
      <HotelPlanMutedBanner usage={usage} sectionKey={section.key} />

      {section.key === "EVENT_BOOKING_REQUEST" &&
      usage &&
      usage.limits.eventRequestsPerMonth != null &&
      !sectionMuted ? (
        <p className="text-sm text-muted-foreground">
          Event requests this month:{" "}
          <strong>
            {usage.eventRequestsThisMonth} / {usage.limits.eventRequestsPerMonth}
          </strong>
          {usage.eventRequestsThisMonth >= usage.limits.eventRequestsPerMonth ? (
            <span className="text-amber-600"> — limit reached. Upgrade to Pro for unlimited.</span>
          ) : null}
        </p>
      ) : null}

      {usage && section.supportsPackages && !packagesMuted ? (
        <p className="text-sm text-muted-foreground">
          Hotel packages:{" "}
          <strong>
            {usage.packagesUsed} / {formatHotelPackageCap(usage.limits.maxHotelPackages)}
          </strong>{" "}
          used across all sections
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{section.label}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{section.headline}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm font-medium">How it works</p>
          <ol className="space-y-2 text-sm text-muted-foreground">
            {section.howItWorks.map((step, i) => (
              <li key={step} className="flex gap-2">
                <span className="font-semibold text-primary">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {section.supportsPackages ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Your packages</h2>
            {!packagesMuted && !sectionMuted ? (
              <Button type="button" size="sm" onClick={() => setShowForm((v) => !v)}>
                <Plus className="mr-2 h-4 w-4" />
                Add package
              </Button>
            ) : null}
          </div>

          {showForm && !packagesMuted && !sectionMuted ? (
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="pkg-title">Package title</Label>
                  <Input
                    id="pkg-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={section.packageHint}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pkg-desc">Description</Label>
                  <Textarea
                    id="pkg-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="What's included, capacity, and booking terms"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="pkg-price">From (KES)</Label>
                    <Input
                      id="pkg-price"
                      type="number"
                      value={priceFrom}
                      onChange={(e) => setPriceFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pkg-guests">Min guests</Label>
                    <Input
                      id="pkg-guests"
                      type="number"
                      value={minGuests}
                      onChange={(e) => setMinGuests(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pkg-rooms">Min rooms</Label>
                    <Input
                      id="pkg-rooms"
                      type="number"
                      value={minRooms}
                      onChange={(e) => setMinRooms(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => void createPackage()} disabled={saving}>
                    {saving ? "Saving…" : "Publish package"}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading packages…</p>
          ) : packages.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No packages yet. Add one so guests can request {section.label.toLowerCase()}.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {packages.map((pkg) => (
                <Card key={pkg.id}>
                  <CardContent className="flex flex-wrap items-start justify-between gap-4 py-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{pkg.title}</p>
                        <Badge variant={pkg.isActive ? "default" : "secondary"}>
                          {pkg.isActive ? "Live" : "Paused"}
                        </Badge>
                        {(pkg._count?.requests ?? 0) > 0 ? (
                          <Badge variant="outline">{pkg._count?.requests} requests</Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {pkg.description}
                      </p>
                      {pkg.priceFrom != null ? (
                        <p className="mt-2 text-sm font-medium">
                          From {formatPrice(pkg.priceFrom, { currency: pkg.currency })}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void togglePackage(pkg.id, pkg.isActive)}
                    >
                      {pkg.isActive ? "Pause" : "Activate"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          {section.key === "EVENT_BOOKING_REQUEST" ? "Event requests inbox" : "Booking requests"}
        </h2>
        <p className="text-sm text-muted-foreground">{section.requestHint}</p>

        {sectionMuted ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Upgrade your hotel plan to receive and manage requests in this section.
            </CardContent>
          </Card>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">Loading requests…</p>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No requests yet. When guests enquire, they appear here for you to quote and confirm.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <Card key={req.id}>
                <CardContent className="space-y-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{req.contactName}</p>
                        <Badge variant={statusVariant(req.status)}>{req.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeDate(req.createdAt)}
                        {req.property ? ` · ${req.property.title}` : ""}
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

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Internal note</Label>
                      <Textarea
                        value={notes[req.id] ?? req.ownerNote ?? ""}
                        onChange={(e) =>
                          setNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                        }
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quote amount (KES)</Label>
                      <Input
                        type="number"
                        value={quotes[req.id] ?? (req.quotedAmount?.toString() ?? "")}
                        onChange={(e) =>
                          setQuotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Select
                      onValueChange={(v) =>
                        void updateRequest(req.id, v as (typeof REQUEST_STATUSES)[number])
                      }
                    >
                      <SelectTrigger className="w-[160px]" disabled={actingId === req.id}>
                        <SelectValue placeholder="Update status" />
                      </SelectTrigger>
                      <SelectContent>
                        {REQUEST_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/dashboard/pro/inbox">
                        Message guest
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
