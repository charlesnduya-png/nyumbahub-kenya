"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PaymentCheckout } from "@/components/payments/payment-checkout";
import {
  ImageUploader,
  type UploadedImage,
} from "@/components/property/image-uploader";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  KENYA_COUNTIES,
  LISTING_TYPES,
  PROPERTY_CATEGORIES,
} from "@/lib/kenya";
import {
  LISTING_PRODUCTS,
  formatProductPrice,
  type ListingProductId,
} from "@/lib/pricing";
import {
  createPropertySchema,
  type CreatePropertyInput,
} from "@/lib/validations/property";
import { cn } from "@/lib/utils";

export default function NewPropertyPage() {
  const router = useRouter();
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [productId, setProductId] = useState<ListingProductId>("featured");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState<string | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);

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
      town: "Kilimani",
      parkingSpaces: 1,
      furnished: false,
      swimmingPool: false,
      security: true,
      parking: true,
      images: [],
    },
  });

  const values = watch();

  function syncImages(next: UploadedImage[]) {
    setImages(next);
    setValue("images", next, { shouldValidate: true });
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
            parking: values.parking,
            swimmingPool: values.swimmingPool,
            furnished: values.furnished,
            security: values.security,
          },
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
    if (submitForReview && !paymentId) {
      toast.error("Pay for a listing plan before submitting for approval");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          images,
          submitForReview,
          paymentId,
          productId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(
          json.message ??
            (submitForReview
              ? "Submitted for admin approval"
              : "Saved as draft"),
        );
        router.push("/dashboard/seller/properties");
      } else if (json.code === "PROFESSIONAL_REQUIRED") {
        toast.error(json.error);
        router.push("/register/professional");
      } else if (json.code === "PAYMENT_REQUIRED") {
        toast.error(json.error);
      } else {
        toast.error(json.error ?? "Failed to create property");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add new property</h1>
        <p className="text-muted-foreground">
          Choose a paid plan, pay with M-Pesa, then submit for admin approval.
        </p>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
        <strong>Pay → Admin approves → Live.</strong> Buyers browse free;
        professionals pay to list.
      </div>

      <form
        onSubmit={handleSubmit((data) => onSubmit(data, true))}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>1. Choose listing plan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
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
                  <span className="text-sm font-semibold">{plan.name}</span>
                  {plan.popular && <Badge>Popular</Badge>}
                </div>
                <p className="text-lg font-bold">{formatProductPrice(plan)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {plan.durationDays} days
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Pay with M-Pesa</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentId ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
                Payment confirmed · ref <strong>{paymentRef}</strong>. You can
                submit for admin approval.
              </div>
            ) : (
              <PaymentCheckout
                productId={productId}
                onPaid={(payment) => {
                  setPaymentId(payment.id);
                  setPaymentRef(payment.reference);
                }}
                ctaLabel="Pay listing fee"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploader value={images} onChange={syncImages} maxFiles={12} />
            <p className="mt-2 text-xs text-muted-foreground">
              Add at least one clear exterior or living-room photo. First photo
              (or the one marked Cover) is the listing image.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Property details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. 3-Bed Apartment in Kilimani"
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
                  onValueChange={(v) =>
                    setValue(
                      "listingType",
                      v as CreatePropertyInput["listingType"],
                    )
                  }
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

            <div className="space-y-2">
              <Label htmlFor="price">Price (KES)</Label>
              <Input id="price" type="number" {...register("price")} />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>County</Label>
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
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "furnished" as const, label: "Furnished" },
              { key: "swimmingPool" as const, label: "Swimming pool" },
              { key: "security" as const, label: "24/7 Security" },
              { key: "parking" as const, label: "Parking available" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <Label>{label}</Label>
                <Switch
                  checked={Boolean(values[key])}
                  onCheckedChange={(checked) => setValue(key, checked)}
                />
              </div>
            ))}
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
          <Button type="submit" disabled={submitting || !paymentId}>
            {submitting
              ? "Submitting…"
              : paymentId
                ? "Submit for admin approval"
                : "Pay first to submit"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={submitting}
            onClick={handleSubmit((data) => onSubmit(data, false))}
          >
            Save as draft (no payment)
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
