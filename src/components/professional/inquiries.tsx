"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Phone, MessageSquare } from "lucide-react";
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
import { formatRelativeDate } from "@/lib/utils";

type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "VIEWING_SCHEDULED"
  | "NEGOTIATING"
  | "WON"
  | "LOST";

interface LeadRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  status: LeadStatus;
  source: string | null;
  createdAt: string;
  property: { id: string; title: string; slug: string };
  buyer: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}

const STATUS_OPTIONS: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "VIEWING_SCHEDULED",
  "NEGOTIATING",
  "WON",
  "LOST",
];

export function ProfessionalInquiries() {
  const [items, setItems] = useState<LeadRow[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads/received");
      const json = (await res.json()) as {
        success?: boolean;
        data?: LeadRow[];
        error?: string;
      };
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Could not load inquiries");
        return;
      }
      setItems(json.data ?? []);
    } catch {
      toast.error("Could not load inquiries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return items;
    return items.filter((i) => i.status === filter);
  }, [items, filter]);

  const newCount = items.filter((i) => i.status === "NEW").length;
  const viewingCount = items.filter(
    (i) => i.source === "viewing_booking" || i.status === "VIEWING_SCHEDULED",
  ).length;

  async function updateStatus(id: string, status: LeadStatus) {
    const prev = items;
    setItems((list) => list.map((i) => (i.id === id ? { ...i, status } : i)));
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        setItems(prev);
        toast.error(json.error ?? "Update failed");
        return;
      }
      toast.success(`Inquiry marked ${status.replace(/_/g, " ").toLowerCase()}`);
    } catch {
      setItems(prev);
      toast.error("Update failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Inquiries</h1>
          <p className="text-muted-foreground">
            Buyer enquiries and viewing requests on your listings — update status as you follow up.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{newCount} new</Badge>
          {viewingCount > 0 ? (
            <Badge variant="secondary">{viewingCount} viewing requests</Badge>
          ) : null}
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/pro/viewings">Open viewings calendar</Link>
          </Button>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enquiry pipeline ({loading ? "…" : filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading inquiries…
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No inquiries yet. When buyers contact you or book a viewing, they appear here.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Buyer</th>
                  <th className="pb-3 pr-4 font-medium">Listing</th>
                  <th className="pb-3 pr-4 font-medium">Message</th>
                  <th className="pb-3 pr-4 font-medium">Source</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">When</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const phone =
                    item.phone || item.buyer?.phone || "";
                  const email =
                    item.email || item.buyer?.email || "";

                  return (
                    <tr key={item.id} className="border-b last:border-0 align-top">
                      <td className="py-3 pr-4">
                        <p className="font-medium">{item.name}</p>
                        {phone ? (
                          <p className="text-muted-foreground">{phone}</p>
                        ) : null}
                        {email ? (
                          <p className="text-muted-foreground">{email}</p>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 max-w-[180px]">
                        <Link
                          href={`/properties/${item.property.slug}`}
                          className="text-primary hover:underline"
                        >
                          {item.property.title}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 max-w-[240px] whitespace-pre-wrap text-muted-foreground">
                        {item.message ?? "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline">
                          {item.source === "viewing_booking"
                            ? "Viewing"
                            : item.source ?? "website"}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Select
                          value={item.status}
                          onValueChange={(v) =>
                            updateStatus(item.id, v as LeadStatus)
                          }
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {formatRelativeDate(item.createdAt)}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          {phone ? (
                            <Button size="sm" variant="ghost" asChild>
                              <a href={`tel:${phone}`}>
                                <Phone className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          ) : null}
                          {item.buyer?.id ? (
                            <Button size="sm" variant="ghost" asChild>
                              <Link
                                href={`/dashboard/pro/inbox?peer=${item.buyer.id}&property=${item.property.id}`}
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
