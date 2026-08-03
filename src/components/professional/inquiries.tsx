"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
import {
  mockProfessionalInquiries,
  type ProfessionalInquiry,
} from "@/data/professional";
import { formatRelativeDate } from "@/lib/utils";

const STATUS_OPTIONS: ProfessionalInquiry["status"][] = [
  "NEW",
  "CONTACTED",
  "VIEWING_SCHEDULED",
  "NEGOTIATING",
  "WON",
  "LOST",
];

export function ProfessionalInquiries() {
  const [items, setItems] = useState(mockProfessionalInquiries);
  const [filter, setFilter] = useState<string>("ALL");

  const filtered = useMemo(() => {
    if (filter === "ALL") return items;
    return items.filter((i) => i.status === filter);
  }, [items, filter]);

  function updateStatus(id: string, status: ProfessionalInquiry["status"]) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    toast.success(`Inquiry marked ${status.replace(/_/g, " ").toLowerCase()}`);
  }

  const newCount = items.filter((i) => i.status === "NEW").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Inquiries</h1>
          <p className="text-muted-foreground">
            All buyer enquiries on your listings — update status as you follow up.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{newCount} new</Badge>
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
          <CardTitle>Enquiry pipeline ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
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
              {filtered.map((item) => (
                <tr key={item.id} className="border-b last:border-0 align-top">
                  <td className="py-3 pr-4">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-muted-foreground">{item.phone}</p>
                    <p className="text-muted-foreground">{item.email}</p>
                  </td>
                  <td className="py-3 pr-4 max-w-[180px]">
                    <Link
                      href={`/properties/${item.propertyId}`}
                      className="text-primary hover:underline"
                    >
                      {item.propertyTitle}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 max-w-[240px] text-muted-foreground">
                    {item.message}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant="outline">{item.source}</Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <Select
                      value={item.status}
                      onValueChange={(v) =>
                        updateStatus(
                          item.id,
                          v as ProfessionalInquiry["status"],
                        )
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
                      <Button size="sm" variant="ghost" asChild>
                        <a href={`tel:${item.phone}`}>
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <a
                          href={`https://wa.me/254${item.phone.replace(/\D/g, "").slice(-9)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
