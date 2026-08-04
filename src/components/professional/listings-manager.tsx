"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Archive,
  Eye,
  Megaphone,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ViewsChart } from "@/components/professional/views-chart";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { portfolioViewsSeries } from "@/data/analytics";
import { mockProperties } from "@/data/mock";
import { getListingTypeLabel } from "@/lib/kenya";
import { formatPrice } from "@/lib/utils";

export type ManagedListing = {
  id: string;
  title: string;
  slug: string;
  listingType: "BUY" | "RENT" | "LAND" | "COMMERCIAL" | "HOLIDAY";
  propertyType?: string;
  description?: string;
  price: number;
  currency: string;
  town: string;
  county: string;
  estate?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  status: string;
  views: number;
};

function buildInitialListings(): ManagedListing[] {
  return mockProperties.slice(0, 8).map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    listingType: p.listingType,
    propertyType: p.propertyType,
    description: `${p.title} in ${p.town}, ${p.county}.`,
    price: p.price,
    currency: p.currency,
    town: p.town,
    county: p.county,
    estate: p.estate,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    status: p.status,
    views: p.views,
  }));
}

export function ListingsManager() {
  const [listings, setListings] = useState<ManagedListing[]>(buildInitialListings);
  const [editing, setEditing] = useState<ManagedListing | null>(null);
  const [deleting, setDeleting] = useState<ManagedListing | null>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Partial<ManagedListing>>({});

  const counts = useMemo(
    () => ({
      all: listings.length,
      active: listings.filter((p) => p.status === "ACTIVE").length,
      pending: listings.filter((p) => p.status === "PENDING").length,
      archived: listings.filter((p) => p.status === "ARCHIVED").length,
      views: listings.reduce((s, p) => s + p.views, 0),
    }),
    [listings],
  );

  function openEdit(listing: ManagedListing) {
    setEditing(listing);
    setDraft({ ...listing });
  }

  async function saveEdit() {
    if (!editing || !draft.title || draft.price == null) {
      toast.error("Title and price are required");
      return;
    }
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        id: editing.id,
        title: draft.title,
        price: Number(draft.price),
        county: draft.county,
        town: draft.town,
        estate: draft.estate,
        bedrooms: draft.bedrooms != null ? Number(draft.bedrooms) : undefined,
        bathrooms:
          draft.bathrooms != null ? Number(draft.bathrooms) : undefined,
        listingType: draft.listingType,
      };

      const desc = (draft.description ?? "").trim();
      if (desc.length >= 20) {
        payload.description = desc;
      }

      const res = await fetch(`/api/properties/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));

      // Always update local UI (demo-friendly even if API/DB fails)
      setListings((prev) =>
        prev.map((p) =>
          p.id === editing.id
            ? {
                ...p,
                title: String(draft.title),
                description: draft.description ?? p.description,
                price: Number(draft.price),
                county: String(draft.county ?? p.county),
                town: String(draft.town ?? p.town),
                estate: draft.estate ?? p.estate,
                bedrooms:
                  draft.bedrooms != null ? Number(draft.bedrooms) : p.bedrooms,
                bathrooms:
                  draft.bathrooms != null
                    ? Number(draft.bathrooms)
                    : p.bathrooms,
                listingType:
                  (draft.listingType as ManagedListing["listingType"]) ??
                  p.listingType,
              }
            : p,
        ),
      );

      if (!res.ok && !json.success) {
        toast.message("Listing updated locally", {
          description: "Database offline — changes saved in this session.",
        });
      } else {
        toast.success("Listing updated");
      }
      setEditing(null);
    } catch {
      setListings((prev) =>
        prev.map((p) =>
          p.id === editing.id
            ? {
                ...p,
                ...draft,
                title: String(draft.title),
                price: Number(draft.price),
              }
            : p,
        ),
      );
      toast.success("Listing updated (demo)");
      setEditing(null);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await fetch(`/api/properties/${deleting.id}`, { method: "DELETE" });
      setListings((prev) => prev.filter((p) => p.id !== deleting.id));
      toast.success("Listing deleted");
      setDeleting(null);
    } catch {
      setListings((prev) => prev.filter((p) => p.id !== deleting.id));
      toast.success("Listing deleted (demo)");
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  }

  function archiveListing(listing: ManagedListing) {
    setListings((prev) =>
      prev.map((p) =>
        p.id === listing.id ? { ...p, status: "ARCHIVED" } : p,
      ),
    );
    toast.success("Listing archived");
    void fetch(`/api/properties/${listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: listing.id, status: "DRAFT" }),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">All listings</h1>
          <p className="text-muted-foreground">
            Update, delete, archive, and track views for every property.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/seller/properties/new">
            <Plus className="mr-2 h-4 w-4" />
            Add property
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">All {counts.all}</Badge>
        <Badge>Active {counts.active}</Badge>
        <Badge variant="outline">Pending {counts.pending}</Badge>
        <Badge variant="secondary">Archived {counts.archived}</Badge>
        <Badge variant="outline">
          <Eye className="mr-1 h-3 w-3" />
          {counts.views.toLocaleString()} total views
        </Badge>
      </div>

      <ViewsChart data={portfolioViewsSeries} />

      <Card>
        <CardHeader>
          <CardTitle>Listings inventory</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Title</th>
                <th className="pb-3 pr-4 font-medium">Type</th>
                <th className="pb-3 pr-4 font-medium">Price</th>
                <th className="pb-3 pr-4 font-medium">Location</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Views</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="max-w-[220px] truncate py-3 pr-4 font-medium">
                    {p.title}
                  </td>
                  <td className="py-3 pr-4">
                    {getListingTypeLabel(p.listingType)}
                  </td>
                  <td className="py-3 pr-4">
                    {formatPrice(p.price, { currency: p.currency })}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {p.town}, {p.county}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge
                      variant={
                        p.status === "ACTIVE"
                          ? "default"
                          : p.status === "PENDING"
                            ? "outline"
                            : "secondary"
                      }
                    >
                      {p.status}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 font-medium">
                    {p.views.toLocaleString()}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/properties/${p.slug}`}>
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(p)}
                        aria-label={`Edit ${p.title}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="secondary" asChild>
                        <Link href="/dashboard/seller/promote">
                          <Megaphone className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => archiveListing(p)}
                        aria-label={`Archive ${p.title}`}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleting(p)}
                        aria-label={`Delete ${p.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Update listing</DialogTitle>
            <DialogDescription>
              Changes apply to your professional listing. Republish may need
              admin approval if status was live.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={draft.title ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price (KES)</Label>
              <Input
                id="edit-price"
                type="number"
                value={draft.price ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, price: Number(e.target.value) }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>County</Label>
                <Input
                  value={draft.county ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, county: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Town</Label>
                <Input
                  value={draft.town ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, town: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Bedrooms</Label>
                <Input
                  type="number"
                  value={draft.bedrooms ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      bedrooms: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Bathrooms</Label>
                <Input
                  type="number"
                  value={draft.bathrooms ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      bathrooms: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Listing type</Label>
              <Select
                value={draft.listingType}
                onValueChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    listingType: v as ManagedListing["listingType"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["BUY", "RENT", "LAND", "COMMERCIAL", "HOLIDAY"] as const).map(
                    (t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={4}
                value={draft.description ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, description: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={() => void saveEdit()} disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete listing?</DialogTitle>
            <DialogDescription>
              This will permanently remove{" "}
              <strong>{deleting?.title}</strong> from your professional account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => void confirmDelete()}
            >
              {busy ? "Deleting…" : "Delete listing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
