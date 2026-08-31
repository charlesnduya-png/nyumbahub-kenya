"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getHotelSection } from "@/lib/hotel-services";
import { formatPrice, formatRelativeDate } from "@/lib/utils";

type PackageRow = {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  priceFrom: number | null;
  currency: string;
  category: string;
  owner?: { name: string | null; email: string } | null;
  property?: { title: string } | null;
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

export function AdminHotelServicesPanel({ slug }: { slug: string }) {
  const section = getHotelSection(slug);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);

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
              {packages.map((pkg) => (
                <Card key={pkg.id}>
                  <CardContent className="py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
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
                        {pkg.priceFrom != null ? (
                          <p className="mt-2 text-sm font-medium">
                            From {formatPrice(pkg.priceFrom, { currency: pkg.currency })}
                          </p>
                        ) : null}
                      </div>
                      {(pkg._count?.requests ?? 0) > 0 ? (
                        <Badge variant="outline">{pkg._count?.requests} requests</Badge>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
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
