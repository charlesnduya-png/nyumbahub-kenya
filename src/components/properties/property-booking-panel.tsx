import nextDynamic from "next/dynamic";
import Link from "next/link";
import { ListingAgentSection } from "@/components/properties/listing-agent-section";
import { SignInToUnlock } from "@/components/properties/sign-in-to-unlock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { isStayListing, stayLabel } from "@/lib/listing-kinds";
import { cn } from "@/lib/utils";
import type { ListingHostSummary } from "@/types";

const BookStayForm = nextDynamic(
  () =>
    import("@/components/properties/book-stay-form").then((m) => m.BookStayForm),
  { loading: () => <Skeleton className="h-40 w-full rounded-lg" /> },
);

const RentalListingActions = nextDynamic(
  () =>
    import("@/components/properties/rental-listing-actions").then(
      (m) => m.RentalListingActions,
    ),
  { loading: () => <Skeleton className="h-32 w-full rounded-lg" /> },
);

const ContactSellerForm = nextDynamic(
  () =>
    import("@/components/properties/contact-seller-form").then(
      (m) => m.ContactSellerForm,
    ),
  { loading: () => <Skeleton className="h-10 w-full rounded-lg" /> },
);

const PropertyOfferForm = nextDynamic(
  () =>
    import("@/components/properties/property-offer-form").then(
      (m) => m.PropertyOfferForm,
    ),
  { loading: () => <Skeleton className="h-36 w-full rounded-lg" /> },
);

const GatedContactLinks = nextDynamic(
  () =>
    import("@/components/properties/gated-contact-links").then(
      (m) => m.GatedContactLinks,
    ),
  { loading: () => <Skeleton className="h-10 w-full rounded-lg" /> },
);

const ScheduleViewingForm = nextDynamic(
  () =>
    import("@/components/properties/schedule-viewing-form").then(
      (m) => m.ScheduleViewingForm,
    ),
  { loading: () => <Skeleton className="h-10 w-full rounded-lg" /> },
);

type RentalRoom = {
  id: string;
  label: string;
  floor: string | null;
  price: number | null;
  status: "AVAILABLE" | "RENTED";
};

type PropertyBookingPanelProps = {
  className?: string;
  signedIn: boolean;
  callbackPath: string;
  listingHost: ListingHostSummary | null | undefined;
  property: {
    id: string;
    slug: string;
    title: string;
    listingType: string;
    price: number;
    currency: string;
    views: number;
    publishedAt: Date | string | null;
  };
  discountPercent: number;
  salePrice: number;
  hostUserId?: string;
  memberDiscountRate: number;
  whatsappPhone: string | null;
  whatsappMessage: string;
  callPhone: string | null;
  rentalRooms: RentalRoom[];
};

export function PropertyBookingPanel({
  className,
  signedIn,
  callbackPath,
  listingHost,
  property,
  discountPercent,
  salePrice,
  hostUserId,
  memberDiscountRate,
  whatsappPhone,
  whatsappMessage,
  callPhone,
  rentalRooms,
}: PropertyBookingPanelProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {listingHost ? (
        <ListingAgentSection
          host={listingHost}
          canViewProfile={signedIn}
          profileCallbackPath={callbackPath}
        />
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>
            {isStayListing(property.listingType)
              ? `Book this ${stayLabel(property.listingType).toLowerCase()} stay`
              : property.listingType === "RENT"
                ? "Reserve this rental"
                : "Interested in this property?"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!signedIn ? (
            <SignInToUnlock
              title="Sign in to contact the lister"
              description="Message, book a viewing, WhatsApp, and call are available after you sign in."
              callbackPath={callbackPath}
              minHeightClassName="min-h-[160px]"
            />
          ) : (
            <>
              {isStayListing(property.listingType) ? (
                <BookStayForm
                  propertyId={property.id}
                  propertySlug={property.slug}
                  propertyTitle={property.title}
                  pricePerNight={property.price}
                  discountPercent={discountPercent}
                  currency={property.currency}
                  hostUserId={hostUserId}
                  memberDiscountRate={memberDiscountRate}
                />
              ) : property.listingType === "RENT" ? (
                <RentalListingActions
                  propertyId={property.id}
                  propertySlug={property.slug}
                  propertyTitle={property.title}
                  price={salePrice}
                  currency={property.currency}
                  hostUserId={hostUserId}
                  whatsappPhone={whatsappPhone}
                  whatsappMessage={whatsappMessage}
                  callPhone={callPhone}
                  rooms={rentalRooms}
                />
              ) : (
                <>
                  <ContactSellerForm
                    propertyId={property.id}
                    propertyTitle={property.title}
                    hostUserId={hostUserId}
                  />
                  <PropertyOfferForm
                    propertyId={property.id}
                    propertyTitle={property.title}
                    listedPrice={salePrice}
                    currency={property.currency}
                  />
                </>
              )}
              {property.listingType !== "RENT" ? (
                <GatedContactLinks
                  whatsappPhone={whatsappPhone}
                  whatsappMessage={whatsappMessage}
                  callPhone={callPhone}
                  whatsappLabel="WhatsApp agent"
                />
              ) : null}
              {isStayListing(property.listingType) ? (
                <p className="text-center text-xs text-muted-foreground">
                  Or{" "}
                  <Link href="/dashboard/tenant/messages" className="text-primary hover:underline">
                    open your inbox
                  </Link>{" "}
                  ·{" "}
                  <Link href="/dashboard/tenant/bookings" className="text-primary hover:underline">
                    view bookings
                  </Link>
                </p>
              ) : property.listingType === "RENT" ? null : (
                <ScheduleViewingForm
                  propertyId={property.id}
                  propertyTitle={property.title}
                />
              )}
            </>
          )}
          <Separator />
          <p className="text-sm text-muted-foreground">
            {property.views.toLocaleString()} views · Listed{" "}
            {property.publishedAt
              ? new Date(property.publishedAt).toLocaleDateString("en-KE")
              : "recently"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
