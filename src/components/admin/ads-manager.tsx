"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PropertyMediaImage } from "@/components/property/property-media-image";
import { compressImageFile } from "@/lib/compress-image";
import {
  AD_PLACEMENT_LABELS,
  AD_PLACEMENTS,
  type SiteAdPlacement,
} from "@/lib/ads";

type AdRow = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  placement: SiteAdPlacement;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  clicks: number;
  impressions: number;
};

type AdForm = {
  title: string;
  imageUrl: string;
  linkUrl: string;
  placement: SiteAdPlacement;
  isActive: boolean;
  startDate: string;
  endDate: string;
};

const emptyForm = (): AdForm => ({
  title: "",
  imageUrl: "",
  linkUrl: "",
  placement: "HOME_BANNER",
  isActive: true,
  startDate: "",
  endDate: "",
});

function toDateInput(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function rowToForm(ad: AdRow): AdForm {
  return {
    title: ad.title,
    imageUrl: ad.imageUrl,
    linkUrl: ad.linkUrl ?? "",
    placement: ad.placement,
    isActive: ad.isActive,
    startDate: toDateInput(ad.startDate),
    endDate: toDateInput(ad.endDate),
  };
}

export function AdsManager() {
  const [ads, setAds] = useState<AdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const isEditing = editingId !== null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ads");
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Could not load ads");
        setAds([]);
        return;
      }
      setAds(json.data ?? []);
    } catch {
      toast.error("Could not load ads");
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(ad: AdRow) {
    setEditingId(ad.id);
    setForm(rowToForm(ad));
    setDialogOpen(true);
  }

  function updateField<K extends keyof AdForm>(key: K, value: AdForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function uploadImage(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be 8MB or smaller");
      return;
    }

    setUploading(true);
    try {
      const compressed = await compressImageFile(file);
      const formData = new FormData();
      formData.append("file", compressed);
      formData.append("type", "ad");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      const url = (json.data?.url as string | undefined) ?? null;
      if (!res.ok || !json.success || !url) {
        toast.error(json.error ?? "Image upload failed");
        return;
      }
      updateField("imageUrl", url);
      toast.success("Ad image uploaded");
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  async function save() {
    if (form.title.trim().length < 3) {
      toast.error("Title is required");
      return;
    }
    if (!form.imageUrl.trim()) {
      toast.error("Upload an ad image");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        imageUrl: form.imageUrl.trim(),
        linkUrl: form.linkUrl.trim() || null,
        placement: form.placement,
        isActive: form.isActive,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };
      const res = await fetch(
        isEditing ? `/api/admin/ads/${editingId}` : "/api/admin/ads",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Could not save ad");
        return;
      }
      toast.success(isEditing ? "Ad updated" : "Ad created");
      setDialogOpen(false);
      await load();
    } catch {
      toast.error("Could not save ad");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this ad? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/ads/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Could not delete ad");
        return;
      }
      toast.success("Ad deleted");
      await load();
    } catch {
      toast.error("Could not delete ad");
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleActive(ad: AdRow) {
    try {
      const res = await fetch(`/api/admin/ads/${ad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !ad.isActive }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Could not update ad");
        return;
      }
      setAds((prev) =>
        prev.map((row) =>
          row.id === ad.id ? { ...row, isActive: !ad.isActive } : row,
        ),
      );
    } catch {
      toast.error("Could not update ad");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Advertisements</h1>
          <p className="text-muted-foreground">
            Create banners that appear on the homepage, search, and listing
            pages.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create ad
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading ads…
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Title</th>
                  <th className="pb-3 pr-4 font-medium">Placement</th>
                  <th className="pb-3 pr-4 font-medium">Clicks</th>
                  <th className="pb-3 pr-4 font-medium">Impressions</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ads.length === 0 ? (
                  <tr>
                    <td
                      className="py-8 text-center text-sm text-muted-foreground"
                      colSpan={6}
                    >
                      No advertisements yet. Create one to show it on the site.
                    </td>
                  </tr>
                ) : (
                  ads.map((ad) => (
                    <tr key={ad.id} className="border-b last:border-0">
                      <td className="max-w-[220px] py-3 pr-4 font-medium">
                        {ad.title}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline">
                          {AD_PLACEMENT_LABELS[ad.placement]}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        {ad.clicks.toLocaleString("en-KE")}
                      </td>
                      <td className="py-3 pr-4">
                        {ad.impressions.toLocaleString("en-KE")}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={ad.isActive ? "default" : "secondary"}>
                          {ad.isActive ? "Active" : "Paused"}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(ad)}
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void toggleActive(ad)}
                          >
                            {ad.isActive ? "Pause" : "Activate"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={deletingId === ad.id}
                            onClick={() => void remove(ad.id)}
                          >
                            {deletingId === ad.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit ad" : "Create ad"}</DialogTitle>
            <DialogDescription>
              Upload a banner, pick where it appears, and add an optional link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ad-title">Title</Label>
              <Input
                id="ad-title"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="List your property this month"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ad-placement">Where it appears</Label>
              <Select
                value={form.placement}
                onValueChange={(value) =>
                  updateField("placement", value as SiteAdPlacement)
                }
              >
                <SelectTrigger id="ad-placement">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AD_PLACEMENTS.map((placement) => (
                    <SelectItem key={placement} value={placement}>
                      {AD_PLACEMENT_LABELS[placement]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ad-link">Link (optional)</Label>
              <Input
                id="ad-link"
                value={form.linkUrl}
                onChange={(e) => updateField("linkUrl", e.target.value)}
                placeholder="/pricing or https://…"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ad-start">Start date</Label>
                <Input
                  id="ad-start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => updateField("startDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ad-end">End date</Label>
                <Input
                  id="ad-end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => updateField("endDate", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ad image</Label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadImage(file);
                }}
              />
              {form.imageUrl ? (
                <div className="space-y-3">
                  <div className="relative aspect-[16/7] overflow-hidden rounded-lg border bg-muted">
                    <PropertyMediaImage
                      src={form.imageUrl}
                      alt="Ad preview"
                      fill
                      className="object-cover"
                    />
                    {uploading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    Change image
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => imageInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 px-4 py-10 text-sm text-muted-foreground transition-colors hover:bg-muted/50 disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  ) : (
                    <ImagePlus className="h-8 w-8" />
                  )}
                  <span className="font-medium text-foreground">
                    {uploading ? "Uploading…" : "Upload ad image"}
                  </span>
                  <span>JPG, PNG, WebP or GIF · max 8MB</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">Active</p>
                <p className="text-sm text-muted-foreground">
                  Active ads appear on the public site.
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => updateField("isActive", checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={saving || uploading}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : isEditing ? (
                "Save changes"
              ) : (
                "Create ad"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
