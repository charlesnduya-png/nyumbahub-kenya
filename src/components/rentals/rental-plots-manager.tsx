"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Home,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { PropertyManagerInvite } from "@/components/rentals/property-manager-invite";
import { RentLedger } from "@/components/rentals/rent-ledger";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KENYA_COUNTIES } from "@/lib/kenya";
import { DEFAULT_LISTING_CURRENCY } from "@/lib/currencies";
import { formatPrice } from "@/lib/utils";
import {
  ImageUploader,
  type UploadedImage,
} from "@/components/property/image-uploader";
import { CurrencySelect } from "@/components/properties/currency-select";
import { UNIT_FLOOR_OPTIONS } from "@/lib/validations/rental-plot";
import { Switch } from "@/components/ui/switch";

type PlotUnit = {
  id: string;
  title: string;
  slug: string;
  unitLabel: string | null;
  unitFloor: string | null;
  price: number;
  currency: string;
  bedrooms: number | null;
  bathrooms: number | null;
  status: string;
  propertyType: string;
  listingType: string;
  isVacant?: boolean;
  housesTotal?: number;
  housesAvailable?: number;
  housesRented?: number;
  images?: Array<{ url: string; alt: string | null }>;
};

type PlotRow = {
  id: string;
  name: string;
  description: string | null;
  county: string;
  town: string;
  estate: string | null;
  address: string | null;
  counts: {
    total: number;
    vacant: number;
    rented: number;
    pending: number;
  };
  units: PlotUnit[];
};

const EMPTY_UNIT_FORM = {
  unitLabel: "",
  unitFloor: "First floor",
  propertyType: "APARTMENT",
  price: "",
  currency: DEFAULT_LISTING_CURRENCY,
  bedrooms: "1",
  bathrooms: "1",
  housesAvailable: "1",
  furnished: false,
  description: "",
  images: [] as UploadedImage[],
};

export function RentalPlotsManager() {
  const [plots, setPlots] = useState<PlotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [canInviteManager, setCanInviteManager] = useState(false);
  const [canViewRent, setCanViewRent] = useState(false);
  const [canManagePlots, setCanManagePlots] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState<PlotRow | null>(null);
  const [editingUnit, setEditingUnit] = useState<PlotUnit | null>(null);
  const [deletePlot, setDeletePlot] = useState<PlotRow | null>(null);

  const [plotForm, setPlotForm] = useState({
    name: "",
    county: "Nairobi",
    town: "",
    estate: "",
    address: "",
    description: "",
  });

  const [unitForm, setUnitForm] = useState(EMPTY_UNIT_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rental-plots");
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not load plots");
        setPlots([]);
        setCanInviteManager(false);
        setCanViewRent(false);
        setCanManagePlots(false);
        return;
      }
      setPlots(json.data ?? []);
      setCanInviteManager(Boolean(json.canInviteManager));
      setCanViewRent(Boolean(json.canViewRent));
      setCanManagePlots(Boolean(json.canManagePlots));
    } catch {
      toast.error("Could not load plots");
      setPlots([]);
      setCanInviteManager(false);
      setCanViewRent(false);
      setCanManagePlots(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createPlot() {
    if (!plotForm.name.trim() || !plotForm.town.trim()) {
      toast.error("Plot name and town are required");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/rental-plots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: plotForm.name.trim(),
          county: plotForm.county,
          town: plotForm.town.trim(),
          estate: plotForm.estate.trim() || null,
          address: plotForm.address.trim() || null,
          description: plotForm.description.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not create plot");
        return;
      }
      toast.success("Plot created");
      setCreateOpen(false);
      setPlotForm({
        name: "",
        county: "Nairobi",
        town: "",
        estate: "",
        address: "",
        description: "",
      });
      void load();
    } catch {
      toast.error("Could not create plot");
    } finally {
      setBusy(false);
    }
  }

  async function addVacantUnit() {
    if (!unitOpen) return;
    if (!unitForm.unitLabel.trim() || !unitForm.price) {
      toast.error("Unit label and rent price are required");
      return;
    }
    if (!unitForm.unitFloor.trim()) {
      toast.error("Select which floor this house is on");
      return;
    }
    if (unitForm.images.length === 0) {
      toast.error("Add at least one photo of this house");
      return;
    }
    const housesAvailable = Number(unitForm.housesAvailable);
    if (!Number.isInteger(housesAvailable) || housesAvailable < 1) {
      toast.error(
        editingUnit
          ? "Enter the total houses on this listing"
          : "Enter how many houses are available",
      );
      return;
    }
    setBusy(true);
    try {
      const payload = {
        unitLabel: unitForm.unitLabel.trim(),
        unitFloor: unitForm.unitFloor.trim(),
        propertyType: unitForm.propertyType,
        price: Number(unitForm.price),
        currency: unitForm.currency || DEFAULT_LISTING_CURRENCY,
        bedrooms: Number(unitForm.bedrooms) || 0,
        bathrooms: Number(unitForm.bathrooms) || 0,
        furnished: unitForm.furnished,
        housesAvailable,
        description: unitForm.description.trim() || undefined,
        images: unitForm.images.map((img, index) => ({
          url: img.url,
          publicId: img.publicId ?? null,
          alt: img.alt ?? unitForm.unitLabel.trim(),
          isPrimary: img.isPrimary ?? index === 0,
          order: index,
        })),
        ...(editingUnit ? {} : { submitForReview: true }),
      };
      const res = await fetch(
        editingUnit
          ? `/api/rental-plots/${unitOpen.id}/units/${editingUnit.id}`
          : `/api/rental-plots/${unitOpen.id}`,
        {
          method: editingUnit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        toast.error(
          json.error ??
            (editingUnit ? "Could not update listing" : "Could not add vacant unit"),
        );
        return;
      }
      toast.success(
        json.message ?? (editingUnit ? "Listing updated" : "Vacant unit posted"),
      );
      setUnitOpen(null);
      setEditingUnit(null);
      setUnitForm(EMPTY_UNIT_FORM);
      void load();
    } catch {
      toast.error(editingUnit ? "Could not update listing" : "Could not add vacant unit");
    } finally {
      setBusy(false);
    }
  }

  async function openEditUnit(plot: PlotRow, unit: PlotUnit) {
    setBusy(true);
    try {
      const res = await fetch(`/api/rental-plots/${plot.id}/units/${unit.id}`);
      const json = await res.json();
      if (!res.ok || !json.data) {
        toast.error(json.error ?? "Could not load listing");
        return;
      }
      const data = json.data as {
        unitLabel?: string | null;
        unitFloor?: string | null;
        propertyType?: string;
        price?: number;
        currency?: string;
        bedrooms?: number | null;
        bathrooms?: number | null;
        furnished?: boolean;
        description?: string | null;
        housesTotal?: number;
        images?: Array<{
          url: string;
          publicId?: string | null;
          alt?: string | null;
          isPrimary?: boolean;
        }>;
      };
      setEditingUnit(unit);
      setUnitOpen(plot);
      setUnitForm({
        unitLabel: data.unitLabel ?? unit.unitLabel ?? "",
        unitFloor: data.unitFloor || unit.unitFloor || "First floor",
        propertyType: data.propertyType || unit.propertyType || "APARTMENT",
        price: String(data.price ?? unit.price ?? ""),
        currency: data.currency || unit.currency || DEFAULT_LISTING_CURRENCY,
        bedrooms: String(data.bedrooms ?? unit.bedrooms ?? 1),
        bathrooms: String(data.bathrooms ?? unit.bathrooms ?? 1),
        housesAvailable: String(data.housesTotal ?? unit.housesTotal ?? 1),
        furnished: Boolean(data.furnished),
        description: data.description ?? "",
        images: (data.images ?? []).map((img, index) => ({
          url: img.url,
          publicId: img.publicId ?? undefined,
          alt: img.alt ?? undefined,
          isPrimary: img.isPrimary ?? index === 0,
        })),
      });
    } catch {
      toast.error("Could not load listing");
    } finally {
      setBusy(false);
    }
  }

  async function updateUnitStatus(
    plotId: string,
    unitId: string,
    status: "RENTED" | "ACTIVE" | "ARCHIVED",
  ) {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/rental-plots/${plotId}/units/${unitId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Update failed");
        return;
      }
      toast.success(json.message ?? "Updated");
      void load();
    } catch {
      toast.error("Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDeletePlot() {
    if (!deletePlot) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/rental-plots/${deletePlot.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not delete plot");
        return;
      }
      toast.success("Plot deleted");
      setDeletePlot(null);
      void load();
    } catch {
      toast.error("Could not delete plot");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Boma yangu</h1>
          <p className="text-muted-foreground">
            {canInviteManager
              ? "Add plots, post vacant rooms for rent, and invite a manager to handle only those tasks."
              : "Add plots and keep vacant rooms listed for rent."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canViewRent ? (
            <Button variant="outline" asChild>
              <Link href="/dashboard/pro/rent">
                <Wallet className="mr-2 h-4 w-4" />
                Rent this month
              </Link>
            </Button>
          ) : null}
          {canManagePlots ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add plot
            </Button>
          ) : null}
        </div>
      </div>

      {canInviteManager ? <PropertyManagerInvite /> : null}

      {canViewRent ? <RentLedger compact /> : null}

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading plots…
        </div>
      ) : plots.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No plots yet. Create a plot for your building or compound, then
              list vacant units for rent.
            </p>
            {canManagePlots ? (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add your first plot
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {plots.map((plot) => (
            <Card key={plot.id}>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle className="text-lg">{plot.name}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[plot.estate, plot.town, plot.county]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {plot.counts.vacant} vacant
                    </Badge>
                    <Badge variant="outline">{plot.counts.rented} rented</Badge>
                    <Badge variant="outline">{plot.counts.total} houses</Badge>
                    {plot.counts.pending > 0 ? (
                      <Badge>{plot.counts.pending} pending approval</Badge>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canManagePlots ? (
                    <Button
                      size="sm"
                    onClick={() => {
                      setEditingUnit(null);
                      setUnitForm(EMPTY_UNIT_FORM);
                      setUnitOpen(plot);
                    }}
                    >
                      <Home className="mr-1 h-4 w-4" />
                      Post vacant house
                    </Button>
                  ) : null}
                  {canManagePlots ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeletePlot(plot)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                {plot.units.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No units yet. Post a vacant house to list it for rent.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {plot.units.map((unit) => (
                      <div
                        key={unit.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                      >
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          {unit.images?.[0]?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={unit.images[0].url}
                              alt={unit.images[0].alt ?? unit.unitLabel ?? "Unit"}
                              className="h-16 w-20 shrink-0 rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-md bg-muted">
                              <Home className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium">
                              {unit.unitLabel
                                ? `${unit.unitLabel} · `
                                : ""}
                              {unit.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {unit.unitFloor ? `${unit.unitFloor} · ` : ""}
                              {formatPrice(unit.price, {
                                currency: unit.currency,
                              })}
                              /month
                              {unit.bedrooms != null
                                ? ` · ${unit.bedrooms} bed`
                                : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={
                              (unit.housesAvailable ?? 0) > 0
                                ? "default"
                                : unit.status === "RENTED"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {(unit.housesTotal ?? 1) > 1
                              ? `${unit.housesAvailable ?? 0} of ${unit.housesTotal} vacant`
                              : unit.status === "ACTIVE"
                                ? "VACANT"
                                : unit.status}
                          </Badge>
                          {canManagePlots &&
                          unit.status !== "PENDING" &&
                          (unit.housesAvailable ?? 0) > 0 ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() =>
                                void updateUnitStatus(
                                  plot.id,
                                  unit.id,
                                  "RENTED",
                                )
                              }
                            >
                              <KeyRound className="mr-1 h-3.5 w-3.5" />
                              {(unit.housesTotal ?? 1) > 1
                                ? "Mark one rented"
                                : "Mark rented"}
                            </Button>
                          ) : null}
                          {canManagePlots &&
                          unit.status !== "PENDING" &&
                          (unit.housesRented ?? 0) > 0 ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() =>
                                void updateUnitStatus(
                                  plot.id,
                                  unit.id,
                                  "ACTIVE",
                                )
                              }
                            >
                              {(unit.housesTotal ?? 1) > 1
                                ? "Mark one vacant"
                                : "Mark vacant again"}
                            </Button>
                          ) : null}
                          {canManagePlots ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => void openEditUnit(plot, unit)}
                            >
                              <Pencil className="mr-1 h-3.5 w-3.5" />
                              Edit
                            </Button>
                          ) : null}
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/dashboard/pro/view/${unit.id}`}>
                              View
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create plot */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a plot</DialogTitle>
            <DialogDescription>
              Your apartment block, court, or compound. You will add vacant
              houses under it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Plot / building name</Label>
              <Input
                placeholder="e.g. Greenview Courts"
                value={plotForm.name}
                onChange={(e) =>
                  setPlotForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>County</Label>
                <Select
                  value={plotForm.county}
                  onValueChange={(v) =>
                    setPlotForm((f) => ({ ...f, county: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KENYA_COUNTIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Town</Label>
                <Input
                  placeholder="e.g. Kitengela"
                  value={plotForm.town}
                  onChange={(e) =>
                    setPlotForm((f) => ({ ...f, town: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Estate (optional)</Label>
              <Input
                value={plotForm.estate}
                onChange={(e) =>
                  setPlotForm((f) => ({ ...f, estate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                rows={3}
                value={plotForm.description}
                onChange={(e) =>
                  setPlotForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={() => void createPlot()}>
              {busy ? "Saving…" : "Create plot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add vacant unit */}
      <Dialog
        open={!!unitOpen}
        onOpenChange={(o) => {
          if (!o) {
            setUnitOpen(null);
            setEditingUnit(null);
            setUnitForm(EMPTY_UNIT_FORM);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingUnit ? "Edit listing" : "Post vacant house"}
            </DialogTitle>
            <DialogDescription>
              {unitOpen
                ? editingUnit
                  ? `Update this listing at ${unitOpen.name}. Changes go live on the public page.`
                  : `Add vacant rentals at ${unitOpen.name}. Enter how many identical houses are free — each booking deducts one until none are left.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>House / unit label</Label>
                <Input
                  placeholder="e.g. House B, Flat 3"
                  value={unitForm.unitLabel}
                  onChange={(e) =>
                    setUnitForm((f) => ({ ...f, unitLabel: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Floor</Label>
                <Select
                  value={unitForm.unitFloor}
                  onValueChange={(v) =>
                    setUnitForm((f) => ({ ...f, unitFloor: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select floor" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_FLOOR_OPTIONS.map((floor) => (
                      <SelectItem key={floor} value={floor}>
                        {floor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={unitForm.propertyType}
                  onValueChange={(v) =>
                    setUnitForm((f) => ({ ...f, propertyType: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "APARTMENT",
                      "HOUSE",
                      "STUDIO",
                      "MAISONETTE",
                      "BUNGALOW",
                      "OTHER",
                    ].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monthly rent</Label>
                <Input
                  type="number"
                  value={unitForm.price}
                  onChange={(e) =>
                    setUnitForm((f) => ({ ...f, price: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <CurrencySelect
                value={unitForm.currency}
                onValueChange={(currency) =>
                  setUnitForm((f) => ({ ...f, currency }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>
                {editingUnit
                  ? "Total houses on this listing"
                  : "Total houses available"}
              </Label>
              <Input
                type="number"
                min={1}
                max={80}
                value={unitForm.housesAvailable}
                onChange={(e) =>
                  setUnitForm((f) => ({
                    ...f,
                    housesAvailable: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                {editingUnit
                  ? "Rented houses are kept. You can add more vacant houses or remove unused vacant ones."
                  : "How many identical houses of this type are vacant on this plot. When one is rented, the number drops until all are booked. The listing stays public until the last house is taken."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Bedrooms</Label>
                <Input
                  type="number"
                  value={unitForm.bedrooms}
                  onChange={(e) =>
                    setUnitForm((f) => ({ ...f, bedrooms: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Bathrooms</Label>
                <Input
                  type="number"
                  value={unitForm.bathrooms}
                  onChange={(e) =>
                    setUnitForm((f) => ({ ...f, bathrooms: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <Label htmlFor="unit-furnished">Furnished</Label>
              <Switch
                id="unit-furnished"
                checked={unitForm.furnished}
                onCheckedChange={(checked) =>
                  setUnitForm((f) => ({ ...f, furnished: checked }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>About this house (optional)</Label>
              <Textarea
                rows={3}
                placeholder="e.g. Corner unit with balcony, water included, separate kitchen…"
                value={unitForm.description}
                onChange={(e) =>
                  setUnitForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Photos of this house</Label>
              <p className="text-xs text-muted-foreground">
                Upload clear photos of this exact unit — living room, bedroom,
                kitchen, bathroom. At least one photo is required.
              </p>
              <ImageUploader
                value={unitForm.images}
                onChange={(images) =>
                  setUnitForm((f) => ({ ...f, images }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUnitOpen(null);
                setEditingUnit(null);
                setUnitForm(EMPTY_UNIT_FORM);
              }}
            >
              Cancel
            </Button>
            <Button disabled={busy} onClick={() => void addVacantUnit()}>
              {busy
                ? editingUnit
                  ? "Saving…"
                  : "Posting…"
                : editingUnit
                  ? "Save changes"
                  : "Post vacant house"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deletePlot}
        onOpenChange={(o) => !o && setDeletePlot(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete plot?</DialogTitle>
            <DialogDescription>
              This removes <strong>{deletePlot?.name}</strong>. Units under it
              stay in your listings but are unlinked from the plot.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePlot(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => void confirmDeletePlot()}
            >
              Delete plot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
