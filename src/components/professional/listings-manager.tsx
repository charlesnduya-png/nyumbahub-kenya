"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import { LocationMapPicker } from "@/components/maps/location-map-picker";
import {
  ImageUploader,
  type UploadedImage,
} from "@/components/property/image-uploader";
import {
  PropertyVideoUploader,
  type UploadedVideo,
} from "@/components/property/property-video-uploader";
import { getListingTypeLabel } from "@/lib/kenya";
import { DEFAULT_LISTING_CURRENCY } from "@/lib/currencies";
import {
  DEFAULT_LISTING_COUNTRY,
  iso2ForCountry,
} from "@/lib/african-countries";
import { slimListingImagesForSubmit, slimListingVideosForSubmit } from "@/lib/media-assets";
import { MAX_LISTING_VIDEOS } from "@/lib/listing-media";
import { formatPrice } from "@/lib/utils";
import { CurrencySelect } from "@/components/properties/currency-select";
import { CountrySelect } from "@/components/properties/country-select";
import { ListingFeaturesPicker } from "@/components/property/listing-features-picker";
import { listingFeatureSlugsFromAmenities } from "@/lib/listing-features";

export type ManagedListing = {
  id: string;
  title: string;
  slug: string;
  listingType: "BUY" | "RENT" | "LAND" | "COMMERCIAL" | "HOLIDAY" | "HOTEL";
  propertyType?: string;
  description?: string;
  price: number;
  currency: string;
  country?: string | null;
  town: string;
  county: string;
  estate?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  views: number;
  images?: UploadedImage[];
  videos?: UploadedVideo[];
  features?: string[];
  parkingSpaces?: number | null;
};

type EditDraft = Partial<ManagedListing> & {
  images: UploadedImage[];
  videos: UploadedVideo[];
  features: string[];
};

function mapApiListing(p: {
  id: string;
  title: string;
  slug: string;
  listingType: ManagedListing["listingType"];
  propertyType?: string;
  description?: string;
  price: number;
  currency: string;
  country?: string | null;
  town: string;
  county: string;
  estate?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  views: number;
  images?: Array<{
    url: string;
    publicId?: string | null;
    alt?: string | null;
    isPrimary?: boolean;
    order?: number;
  }>;
  videos?: Array<{
    url: string;
    publicId?: string | null;
    title?: string | null;
    thumbnail?: string | null;
  }>;
}): ManagedListing {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    listingType: p.listingType,
    propertyType: p.propertyType,
    description: p.description ?? "",
    price: p.price,
    currency: p.currency,
    country: p.country ?? DEFAULT_LISTING_COUNTRY,
    town: p.town,
    county: p.county,
    estate: p.estate,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    latitude: p.latitude,
    longitude: p.longitude,
    status: p.status,
    views: p.views,
    images: (p.images ?? []).map((img, index) => ({
      url: img.url,
      publicId: img.publicId ?? undefined,
      alt: img.alt ?? undefined,
      isPrimary: img.isPrimary ?? index === 0,
    })),
    videos: (p.videos ?? []).map((video) => ({
      url: video.url,
      publicId: video.publicId ?? undefined,
      title: video.title ?? undefined,
      thumbnail: video.thumbnail ?? undefined,
    })),
  };
}

export function ListingsManager({
  listingType,
  excludeListingTypes,
  hideHeader = false,
  title = "All listings",
  subtitle = "Update photos, location, details, and track views. Hotels are managed under Hotels.",
  newHref = "/dashboard/seller/properties/new",
  newLabel = "Add property",
  emptyHint = "You have no listings yet. Add your first property to start selling or renting on Your Home.",
}: {
  listingType?: ManagedListing["listingType"];
  excludeListingTypes?: ManagedListing["listingType"][];
  hideHeader?: boolean;
  title?: string;
  subtitle?: string;
  newHref?: string;
  newLabel?: string;
  emptyHint?: string;
} = {}) {
  const [listings, setListings] = useState<ManagedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ManagedListing | null>(null);
  const [deleting, setDeleting] = useState<ManagedListing | null>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<EditDraft>({
    images: [],
    videos: [],
    features: [],
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/properties/mine");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setListings(json.data.map(mapApiListing));
        }
      } catch {
        setListings([]);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const visible = useMemo(() => {
    let rows = listings;
    if (listingType) {
      rows = rows.filter((p) => p.listingType === listingType);
    }
    if (excludeListingTypes?.length) {
      rows = rows.filter((p) => !excludeListingTypes.includes(p.listingType));
    }
    return rows;
  }, [listings, listingType, excludeListingTypes]);

  const counts = useMemo(
    () => ({
      all: visible.length,
      active: visible.filter((p) => p.status === "ACTIVE").length,
      pending: visible.filter((p) => p.status === "PENDING").length,
      archived: visible.filter((p) => p.status === "ARCHIVED").length,
      views: visible.reduce((s, p) => s + p.views, 0),
    }),
    [visible],
  );

  function openEdit(listing: ManagedListing) {
    setEditing(listing);
    setDraft({
      ...listing,
      images: listing.images ?? [],
      videos: listing.videos ?? [],
      features: listing.features ?? [],
    });

    void (async () => {
      try {
        const res = await fetch(`/api/properties/${listing.id}`);
        const json = await res.json();
        if (res.ok && json.success && json.data) {
          if (json.data.images) {
            const fullImages = (json.data.images as Array<{
              url: string;
              publicId?: string | null;
              alt?: string | null;
              isPrimary?: boolean;
            }>).map((img, index) => ({
              url: img.url,
              publicId: img.publicId ?? undefined,
              alt: img.alt ?? undefined,
              isPrimary: img.isPrimary ?? index === 0,
            }));
            setDraft((d) => ({ ...d, images: fullImages }));
          }
          if (json.data.videos) {
            const fullVideos = (json.data.videos as Array<{
              url: string;
              publicId?: string | null;
              title?: string | null;
              thumbnail?: string | null;
            }>).map((video) => ({
              url: video.url,
              publicId: video.publicId ?? undefined,
              title: video.title ?? undefined,
              thumbnail: video.thumbnail ?? undefined,
            }));
            setDraft((d) => ({ ...d, videos: fullVideos }));
          }
          const features = listingFeatureSlugsFromAmenities(
            json.data.amenities as Array<{
              amenity?: { name?: string | null; icon?: string | null };
            }>,
          );
          setDraft((d) => ({
            ...d,
            features,
            parkingSpaces: json.data.parkingSpaces ?? d.parkingSpaces,
          }));
        }
      } catch {
        // keep media from listing summary
      }
    })();
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
        currency: draft.currency || DEFAULT_LISTING_CURRENCY,
        country: draft.country || DEFAULT_LISTING_COUNTRY,
        county: draft.county,
        town: draft.town,
        estate: draft.estate,
        bedrooms: draft.bedrooms != null ? Number(draft.bedrooms) : undefined,
        bathrooms:
          draft.bathrooms != null ? Number(draft.bathrooms) : undefined,
        listingType: draft.listingType,
        latitude: draft.latitude ?? null,
        longitude: draft.longitude ?? null,
        images: slimListingImagesForSubmit(draft.images ?? []).map(
          (img, index) => ({
            url: img.url,
            publicId: img.publicId,
            alt: img.alt,
            isPrimary: Boolean(img.isPrimary) || index === 0,
            order: index,
          }),
        ),
        videos: slimListingVideosForSubmit(draft.videos ?? []).map((video) => ({
          url: video.url,
          publicId: video.publicId,
          title: video.title,
          thumbnail: video.thumbnail,
        })),
        features: draft.features ?? [],
        parkingSpaces: draft.parkingSpaces != null ? Number(draft.parkingSpaces) : undefined,
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

      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Unable to update listing");
        return;
      }

      const savedImages =
        Array.isArray(json.data?.images) && json.data.images.length > 0
          ? json.data.images.map(
              (
                img: {
                  url: string;
                  publicId?: string | null;
                  alt?: string | null;
                  isPrimary?: boolean;
                },
                index: number,
              ) => ({
                url: img.url,
                publicId: img.publicId ?? undefined,
                alt: img.alt ?? undefined,
                isPrimary: img.isPrimary ?? index === 0,
              }),
            )
          : draft.images;

      setListings((prev) =>
        prev.map((p) =>
          p.id === editing.id
            ? {
                ...p,
                title: String(draft.title),
                description: draft.description ?? p.description,
                price: Number(draft.price),
                currency: draft.currency || p.currency,
                country: draft.country || p.country,
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
                latitude: draft.latitude ?? null,
                longitude: draft.longitude ?? null,
                images: savedImages,
              }
            : p,
        ),
      );
      toast.success("Listing updated");
      setEditing(null);
    } catch {
      toast.error("Unable to update listing");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/properties/${deleting.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Unable to delete listing");
        return;
      }
      setListings((prev) => prev.filter((p) => p.id !== deleting.id));
      toast.success("Listing deleted");
      setDeleting(null);
    } catch {
      toast.error("Unable to delete listing");
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
      {hideHeader ? null : (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
          <Button asChild>
            <Link href={newHref}>
              <Plus className="mr-2 h-4 w-4" />
              {newLabel}
            </Link>
          </Button>
        </div>
      )}

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

      {counts.views > 0 && !listingType ? (
        <ViewsChart
          data={[{ label: "Total", views: counts.views, inquiries: 0 }]}
          title="Listing views"
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>
            {listingType === "HOTEL" ? "Your hotels" : "Listings inventory"}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-muted-foreground">
              Loading listings…
            </p>
          ) : visible.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">{emptyHint}</p>
              <Button asChild className="mt-4">
                <Link href={newHref}>{newLabel}</Link>
              </Button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Title</th>
                  {listingType ? null : (
                    <th className="pb-3 pr-4 font-medium">Type</th>
                  )}
                  <th className="pb-3 pr-4 font-medium">
                    {listingType === "HOTEL" ? "Per night" : "Price"}
                  </th>
                  <th className="pb-3 pr-4 font-medium">Location</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Views</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="max-w-[220px] truncate py-3 pr-4 font-medium">
                      {p.title}
                    </td>
                    {listingType ? null : (
                      <td className="py-3 pr-4">
                        {getListingTypeLabel(p.listingType)}
                      </td>
                    )}
                    <td className="py-3 pr-4">
                      {formatPrice(p.price, { currency: p.currency })}
                      {p.listingType === "HOTEL" || p.listingType === "HOLIDAY"
                        ? " /night"
                        : ""}
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
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg md:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Update listing</DialogTitle>
            <DialogDescription>
              Edit photos, videos, map pin, price, and details for this listing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Photos</Label>
              <ImageUploader
                value={draft.images}
                onChange={(images) => setDraft((d) => ({ ...d, images }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Video links (optional)</Label>
              <PropertyVideoUploader
                value={draft.videos}
                onChange={(videos) => setDraft((d) => ({ ...d, videos }))}
                maxFiles={MAX_LISTING_VIDEOS}
              />
            </div>

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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={draft.price ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, price: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-currency">Currency</Label>
                <CurrencySelect
                  id="edit-currency"
                  value={draft.currency ?? DEFAULT_LISTING_CURRENCY}
                  onValueChange={(currency) =>
                    setDraft((d) => ({ ...d, currency }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-country">Country</Label>
              <CountrySelect
                id="edit-country"
                value={draft.country ?? DEFAULT_LISTING_COUNTRY}
                onValueChange={(country) =>
                  setDraft((d) => ({ ...d, country }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>County / region</Label>
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
                <Label>
                  {draft.listingType === "HOTEL" || listingType === "HOTEL"
                    ? "Rooms"
                    : "Bedrooms"}
                </Label>
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
                    propertyType:
                      v === "HOTEL" ? "HOTEL" : d.propertyType,
                  }))
                }
                disabled={Boolean(listingType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    listingType
                      ? [listingType]
                      : (["BUY", "RENT", "LAND", "COMMERCIAL", "HOLIDAY", "HOTEL"] as const)
                  ).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Map location</Label>
              <LocationMapPicker
                latitude={draft.latitude ?? null}
                longitude={draft.longitude ?? null}
                county={draft.county}
                town={draft.town}
                countryIso={iso2ForCountry(draft.country)}
                onChange={({ latitude, longitude }) =>
                  setDraft((d) => ({ ...d, latitude, longitude }))
                }
                onPlaceSelect={(place) =>
                  setDraft((d) => ({
                    ...d,
                    latitude: place.latitude,
                    longitude: place.longitude,
                    town: place.town || d.town,
                    county: place.county || d.county,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Features</Label>
              <ListingFeaturesPicker
                listingType={draft.listingType ?? listingType}
                value={draft.features ?? []}
                onChange={(features) => setDraft((d) => ({ ...d, features }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-parking-spaces">Parking spaces</Label>
              <Input
                id="edit-parking-spaces"
                type="number"
                value={draft.parkingSpaces ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    parkingSpaces: Number(e.target.value),
                  }))
                }
              />
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
