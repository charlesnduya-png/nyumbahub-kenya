"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm, type Resolver } from "react-hook-form";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PaymentCheckout } from "@/components/payments/payment-checkout";
import {
  ImageUploader,
  type UploadedImage,
} from "@/components/property/image-uploader";
import {
  PropertyVideoUploader,
  type UploadedVideo,
} from "@/components/property/property-video-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  KENYA_COUNTIES,
  LISTING_TYPES,
  PROPERTY_CATEGORIES,
} from "@/lib/kenya";
import { isStayListing } from "@/lib/listing-kinds";
import { LocationMapPicker } from "@/components/maps/location-map-picker";
import { CurrencySelect } from "@/components/properties/currency-select";
import { CountrySelect } from "@/components/properties/country-select";
import { ListingFeaturesPicker } from "@/components/property/listing-features-picker";
import {
  LISTING_PRODUCTS,
  formatProductPrice,
  type ListingProductId,
} from "@/lib/pricing";
import { FREE_TIER_MAX_LISTINGS, LISTINGS_ARE_FREE } from "@/lib/listing-flags";
import { slimListingImagesForSubmit, slimListingVideosForSubmit } from "@/lib/media-assets";
import { MAX_LISTING_IMAGES, MAX_LISTING_VIDEOS } from "@/lib/listing-media";
import { DEFAULT_LISTING_CURRENCY } from "@/lib/currencies";
import {
  DEFAULT_LISTING_COUNTRY,
  isKenyaCountry,
  iso2ForCountry,
} from "@/lib/african-countries";
import {
  createPropertySchema,
  type CreatePropertyInput,
} from "@/lib/validations/property";
import { listingFeatureBySlug } from "@/lib/listing-features";
import { cn } from "@/lib/utils";

export default function NewPropertyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetType = searchParams.get("type");
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [productId, setProductId] = useState<ListingProductId>("featured");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState<string | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [videos, setVideos] = useState<UploadedVideo[]>([]);
  const [monthlyActive, setMonthlyActive] = useState(false);
  const [monthlyEndDate, setMonthlyEndDate] = useState<string | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [listingUsed, setListingUsed] = useState(0);
  const [listingRemaining, setListingRemaining] = useState(FREE_TIER_MAX_LISTINGS);
  const [atLimit, setAtLimit] = useState(false);

  const { data: session } = useSession();
  const isAgent = session?.user?.role === "AGENT";
  const canSubmitWithoutPay = monthlyActive || !atLimit;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreatePropertyInput>({
    resolver: zodResolver(createPropertySchema) as Resolver<CreatePropertyInput>,
    defaultValues: {
      listingType: "BUY",
      propertyType: "APARTMENT",
      county: "Nairobi",
      country: DEFAULT_LISTING_COUNTRY,
      town: "Kilimani",
      parkingSpaces: 1,
      furnished: false,
      swimmingPool: false,
      security: true,
      parking: true,
      features: ["security-24-7"],
      images: [],
      videos: [],
      currency: DEFAULT_LISTING_CURRENCY,
      latitude: null,
      longitude: null,
      rentalRoomsCount: null,
    },
  });

  const values = watch();
  const isRentListing = values.listingType === "RENT";
  const isStay = isStayListing(values.listingType);
  const isHotel = values.listingType === "HOTEL";

  useEffect(() => {
    if (presetType === "HOTEL") {
      setValue("listingType", "HOTEL");
      setValue("propertyType", "HOTEL");
      setValue("features", [
        "reception-24h",
        "free-wifi",
        "breakfast-included",
        "security-24-7",
      ]);
    }
  }, [presetType, setValue]);

  useEffect(() => {
    async function loadSubscription() {
      try {
        const res = await fetch("/api/subscriptions/mine");
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.active) {
            setMonthlyActive(true);
            setMonthlyEndDate(json.data.subscription?.endDate ?? null);
          }
          if (typeof json.data.used === "number") {
            setListingUsed(json.data.used);
          }
          if (typeof json.data.remaining === "number") {
            setListingRemaining(json.data.remaining);
          }
          if (typeof json.data.atLimit === "boolean") {
            setAtLimit(json.data.atLimit);
          }
        }
      } catch {
        // ignore
      } finally {
        setSubLoading(false);
      }
    }
    void loadSubscription();
  }, []);

  function syncImages(next: UploadedImage[]) {
    setImages(next);
    setValue("images", next, { shouldValidate: true });
  }

  function syncVideos(next: UploadedVideo[]) {
    setVideos(next);
    setValue("videos", next, { shouldValidate: true });
  }

  async function generateDescription() {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          propertyType: values.propertyType,
          listingType: values.listingType,
          bedrooms: values.bedrooms,
          bathrooms: values.bathrooms,
          county: values.county,
          town: values.town,
          estate: values.estate,
          price: values.price,
          amenities: {
            parking:
              values.parking ||
              (values.features ?? []).some((slug) =>
                ["garage", "covered-parking", "ample-parking", "visitor-parking"].includes(
                  slug,
                ),
              ),
            swimmingPool: (values.features ?? []).includes("swimming-pool"),
            furnished: (values.features ?? []).includes("furnished"),
            security: (values.features ?? []).includes("security-24-7"),
          },
          highlights: (values.features ?? [])
            .map((slug) => listingFeatureBySlug(slug)?.name)
            .filter((name): name is string => Boolean(name))
            .slice(0, 12),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setValue("description", json.data.description);
        toast.success("AI description generated");
      }
    } catch {
      toast.error("Could not generate description");
    } finally {
      setAiLoading(false);
    }
  }

  async function onSubmit(data: CreatePropertyInput, submitForReview = true) {
    if (submitForReview && images.length === 0) {
      toast.error("Add at least one property photo before submitting");
      return;
    }

    if (submitForReview && !canSubmitWithoutPay) {
      toast.error(
        `Free accounts can list up to ${FREE_TIER_MAX_LISTINGS} properties. Upgrade your plan or archive an existing listing.`,
      );
      return;
    }

    if (atLimit && !monthlyActive) {
      toast.error(
        `Free accounts can list up to ${FREE_TIER_MAX_LISTINGS} properties. Archive one or upgrade.`,
      );
      return;
    }

    setSubmitting(true);
    try {
      const payloadImages = slimListingImagesForSubmit(images).map(
        (img, index) => ({
          url: img.url,
          publicId: img.publicId,
          alt: img.alt,
          isPrimary: img.isPrimary ?? index === 0,
          order: index,
        }),
      );

      const payloadVideos = slimListingVideosForSubmit(videos).map((video) => ({
        url: video.url,
        publicId: video.publicId,
        title: video.title,
      }));

      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          images: payloadImages,
          videos: payloadVideos,
          submitForReview,
          paymentId,
          productId,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        toast.success(
          json.message ??
            (submitForReview
              ? "Submitted for admin approval"
              : "Saved as draft"),
        );
        router.push(
          isAgent ? "/dashboard/pro/listings" : "/dashboard/seller/properties",
        );
        return;
      }

      if (json.code === "PROFESSIONAL_REQUIRED") {
        toast.error(json.error);
        router.push("/register/professional");
      } else if (json.code === "PAYMENT_REQUIRED") {
        toast.error(json.error);
        setMonthlyActive(false);
      } else if (json.code === "LISTING_LIMIT_REACHED") {
        toast.error(json.error);
        setAtLimit(true);
        if (typeof json.used === "number") setListingUsed(json.used);
        if (typeof json.limit === "number") {
          setListingRemaining(0);
        }
      } else if (json.code === "IMAGES_INVALID") {
        toast.error(json.error ?? "Re-upload your photos and try again.");
      } else {
        toast.error(json.error ?? "Failed to create property");
      }
    } catch {
      toast.error(
        "Could not create property. If you added many photos, try again with fewer or smaller images.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function onInvalid(formErrors: typeof errors) {
    const first =
      formErrors.title?.message ||
      formErrors.description?.message ||
      formErrors.price?.message ||
      formErrors.town?.message ||
      formErrors.parkingSpaces?.message ||
      "Please fill in the required fields before submitting.";
    toast.error(String(first));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {isHotel ? "Add hotel" : "Add new property"}
        </h1>
        <p className="text-muted-foreground">
          {isHotel
            ? "Nightly hotel listing with rooms, facilities, photos, and guest bookings."
            : LISTINGS_ARE_FREE
              ? `Free to use for now — up to ${FREE_TIER_MAX_LISTINGS} listings. Submit for admin approval when ready.`
              : `Free accounts get up to ${FREE_TIER_MAX_LISTINGS} listings. Upgrade anytime for more inventory.`}
        </p>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
        {LISTINGS_ARE_FREE ? (
          <>
            <strong>Launch free access.</strong>{" "}
            {subLoading
              ? "Checking your listing allowance…"
              : atLimit
                ? `You have used all ${FREE_TIER_MAX_LISTINGS} listings. Archive one to add another.`
                : `You have used ${listingUsed} of ${FREE_TIER_MAX_LISTINGS} listings (${listingRemaining} remaining).`}
          </>
        ) : monthlyActive ? (
          <>
            <strong>Paid plan active.</strong>{" "}
            {monthlyEndDate
              ? `Valid until ${new Date(monthlyEndDate).toLocaleDateString("en-KE", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}.`
              : "You can list within your plan limit."}
          </>
        ) : (
          <>
            <strong>Free tier.</strong>{" "}
            {subLoading
              ? "Checking your listing allowance…"
              : atLimit
                ? `You have used all ${FREE_TIER_MAX_LISTINGS} free listings. Upgrade below or archive an existing listing.`
                : `You have used ${listingUsed} of ${FREE_TIER_MAX_LISTINGS} free listings (${listingRemaining} remaining).`}
          </>
        )}
      </div>

      <form
        onSubmit={handleSubmit((data) => onSubmit(data, true), onInvalid)}
        className="space-y-6"
      >
        {!LISTINGS_ARE_FREE ? (
          <>
        <Card>
          <CardHeader>
            <CardTitle>1. Listing plan (optional upgrade)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subLoading ? (
              <p className="text-sm text-muted-foreground">Checking plan…</p>
            ) : monthlyActive ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
                <p className="font-medium text-emerald-800 dark:text-emerald-200">
                  Monthly plan active — higher listing limit unlocked
                </p>
                {monthlyEndDate ? (
                  <p className="mt-1 text-muted-foreground">
                    Valid until{" "}
                    {new Date(monthlyEndDate).toLocaleDateString("en-KE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                ) : null}
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Stay on free ({FREE_TIER_MAX_LISTINGS} listings) or choose a
                  monthly plan for more capacity. Agents can also upgrade from{" "}
                  <Link
                    href="/dashboard/agent/subscription"
                    className="underline"
                  >
                    Agent subscription
                  </Link>
                  .
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {LISTING_PRODUCTS.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => {
                        setProductId(plan.id as ListingProductId);
                        setPaymentId(null);
                        setPaymentRef(null);
                      }}
                      className={cn(
                        "rounded-2xl border p-3 text-left transition",
                        productId === plan.id
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/40",
                      )}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {plan.name}
                        </span>
                        {plan.popular && <Badge>Popular</Badge>}
                      </div>
                      <p className="text-lg font-bold">
                        {formatProductPrice(plan)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        / month · up to {plan.maxListings ?? "more"} listings
                      </p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {!monthlyActive ? (
          <Card>
            <CardHeader>
              <CardTitle>2. Pay monthly with M-Pesa (optional)</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentId ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
                  Monthly plan confirmed · ref <strong>{paymentRef}</strong>.
                  Higher listing limit unlocked.
                </div>
              ) : (
                <PaymentCheckout
                  productId={productId}
                  onPaid={(payment) => {
                    setPaymentId(payment.id);
                    setPaymentRef(payment.reference);
                    setMonthlyActive(true);
                    setAtLimit(false);
                    const end = new Date();
                    end.setDate(end.getDate() + 30);
                    setMonthlyEndDate(end.toISOString());
                  }}
                  ctaLabel="Upgrade monthly listing plan"
                />
              )}
            </CardContent>
          </Card>
        ) : null}
          </>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>{LISTINGS_ARE_FREE ? "1" : monthlyActive ? "2" : "3"}. Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploader
              value={images}
              onChange={syncImages}
              maxFiles={MAX_LISTING_IMAGES}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Add up to {MAX_LISTING_IMAGES} clear photos. First photo (or the one
              marked Cover) is the listing image.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {LISTINGS_ARE_FREE ? "1b" : monthlyActive ? "2b" : "3b"}. Video
              links (optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PropertyVideoUploader
              value={videos}
              onChange={syncVideos}
              maxFiles={MAX_LISTING_VIDEOS}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Add up to {MAX_LISTING_VIDEOS} video links (YouTube, Vimeo, or
              direct MP4/WebM).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {LISTINGS_ARE_FREE ? "2" : monthlyActive ? "3" : "4"}. Property details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder={
                  isHotel
                    ? "e.g. Fairview Hotel, Nairobi CBD"
                    : "e.g. 3-Bed Apartment in Kilimani"
                }
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Listing type</Label>
                <Select
                  value={values.listingType}
                  onValueChange={(v) => {
                    const listingType = v as CreatePropertyInput["listingType"];
                    setValue("listingType", listingType);
                    if (listingType === "HOTEL") {
                      setValue("propertyType", "HOTEL");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LISTING_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Property type</Label>
                <Select
                  value={values.propertyType}
                  onValueChange={(v) =>
                    setValue(
                      "propertyType",
                      v as CreatePropertyInput["propertyType"],
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
              <div className="space-y-2">
                <Label htmlFor="price">
                  Price{isStay ? " (per night)" : isRentListing ? " (per month)" : ""}
                </Label>
                <Input id="price" type="number" {...register("price")} />
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <CurrencySelect
                  id="currency"
                  value={values.currency}
                  onValueChange={(v) =>
                    setValue("currency", v as CreatePropertyInput["currency"], {
                      shouldValidate: true,
                    })
                  }
                />
                {errors.currency && (
                  <p className="text-sm text-destructive">
                    {errors.currency.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">{isHotel ? "Rooms" : "Bedrooms"}</Label>
                <Input id="bedrooms" type="number" {...register("bedrooms")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  {...register("bathrooms")}
                />
              </div>
            </div>

            {isRentListing ? (
              <div className="space-y-2 rounded-xl border border-dashed bg-muted/20 p-4">
                <Label htmlFor="rentalRoomsCount">
                  Rooms available for rent in this house
                </Label>
                <Input
                  id="rentalRoomsCount"
                  type="number"
                  min={1}
                  max={40}
                  placeholder="e.g. 4"
                  {...register("rentalRoomsCount")}
                />
                <p className="text-xs text-muted-foreground">
                  Set more than 1 if this house has multiple rooms/units to rent
                  separately. The listing stays public until every room is
                  booked. Leave blank for a whole-house rental.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <CountrySelect
                id="country"
                value={values.country}
                onValueChange={(v) => {
                  setValue("country", v as CreatePropertyInput["country"], {
                    shouldValidate: true,
                  });
                  if (v === "Kenya") {
                    const current = values.county;
                    if (
                      !KENYA_COUNTIES.includes(
                        current as (typeof KENYA_COUNTIES)[number],
                      )
                    ) {
                      setValue("county", "Nairobi");
                    }
                  } else {
                    setValue("county", "");
                    setValue("town", "");
                  }
                }}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  {isKenyaCountry(values.country) ? "County" : "Region / state"}
                </Label>
                {isKenyaCountry(values.country) ? (
                  <Select
                    value={values.county}
                    onValueChange={(v) => setValue("county", v)}
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
                ) : (
                  <Input
                    id="county"
                    placeholder="e.g. Lagos, Gauteng, Greater Accra"
                    {...register("county")}
                  />
                )}
                {errors.county && (
                  <p className="text-sm text-destructive">
                    {errors.county.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="town">Town / Area</Label>
                <Input id="town" {...register("town")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estate">Estate / Street (optional)</Label>
              <Input id="estate" {...register("estate")} />
            </div>
            <div className="space-y-2">
              <Label>Pin on map</Label>
              <LocationMapPicker
                latitude={values.latitude}
                longitude={values.longitude}
                county={values.county}
                town={values.town}
                countryIso={iso2ForCountry(values.country)}
                onChange={({ latitude, longitude }) => {
                  setValue("latitude", latitude, { shouldDirty: true });
                  setValue("longitude", longitude, { shouldDirty: true });
                }}
                onPlaceSelect={(place) => {
                  setValue("latitude", place.latitude, { shouldDirty: true });
                  setValue("longitude", place.longitude, { shouldDirty: true });
                  if (place.town) {
                    setValue("town", place.town, { shouldDirty: true });
                  }
                  if (place.county) {
                    setValue("county", place.county, { shouldDirty: true });
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Description</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateDescription}
              disabled={aiLoading || !values.title}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {aiLoading ? "Generating…" : "AI write"}
            </Button>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={6}
              placeholder="Describe the property, neighbourhood, and nearby amenities…"
              {...register("description")}
            />
            {errors.description && (
              <p className="mt-2 text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isHotel ? "Hotel facilities" : "Features"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ListingFeaturesPicker
              listingType={values.listingType}
              value={values.features ?? []}
              onChange={(features) => setValue("features", features)}
            />
            <div className="space-y-2">
              <Label htmlFor="parkingSpaces">Parking spaces</Label>
              <Input
                id="parkingSpaces"
                type="number"
                {...register("parkingSpaces")}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={
              submitting ||
              atLimit ||
              (!canSubmitWithoutPay && !paymentId)
            }
          >
            {submitting
              ? "Submitting…"
              : canSubmitWithoutPay || paymentId
                ? "Submit for admin approval"
                : "Pay monthly plan first"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={submitting || atLimit}
            onClick={handleSubmit((data) => onSubmit(data, false), onInvalid)}
          >
            Save as draft
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
