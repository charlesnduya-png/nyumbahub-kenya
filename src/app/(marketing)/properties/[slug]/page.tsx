import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Bath,
  Bed,
  Calendar,
  MapPin,
  Share2,
} from "lucide-react";
import { ListingAgentSection } from "@/components/properties/listing-agent-section";
import { PropertyDetailGallery } from "@/components/properties/property-detail-gallery";
import { RelatedPropertiesSection } from "@/components/properties/related-properties-section";
import { SignInToUnlock } from "@/components/properties/sign-in-to-unlock";
import { ListingFeaturesDisplay } from "@/components/property/listing-features-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/auth";
import { getPropertyBySlug, getPropertyBySlugFresh, resolveListingHost } from "@/lib/properties";
import { resolveProfessionalActingContext } from "@/lib/account-team";
import {
  breadcrumbJsonLd,
  generatePropertyMetadata,
  propertyJsonLd,
} from "@/lib/seo";
import { toWhatsAppNumber, telHref } from "@/lib/phone";
import { formatPrice } from "@/lib/utils";
import { getListingTypeLabel, getPropertyTypeLabel } from "@/lib/kenya";
import { isStayListing, stayLabel } from "@/lib/listing-kinds";
import { getPropertyReviews } from "@/lib/reviews";
import { getCustomerMembership } from "@/lib/customer-membership";
import { PropertyReviews } from "@/components/reviews/property-reviews";

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

const MortgageCalculator = nextDynamic(
  () =>
    import("@/components/properties/mortgage-calculator").then(
      (m) => m.MortgageCalculator,
    ),
  { loading: () => <Skeleton className="h-48 w-full rounded-lg" /> },
);

const ScheduleViewingForm = nextDynamic(
  () =>
    import("@/components/properties/schedule-viewing-form").then(
      (m) => m.ScheduleViewingForm,
    ),
  { loading: () => <Skeleton className="h-10 w-full rounded-lg" /> },
);

const PropertyLocationMap = nextDynamic(
  () =>
    import("@/components/maps/property-location-map").then(
      (m) => m.PropertyLocationMap,
    ),
  { loading: () => <Skeleton className="aspect-video w-full rounded-lg" /> },
);

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function getPropertyDescription(property: {
  title: string;
  description?: string;
  town: string;
  county: string;
  country?: string | null;
  estate?: string | null;
  listingType: string;
  propertyType: string;
  bedrooms?: number | null;
}): string {
  if ("description" in property && property.description) {
    return property.description;
  }

  const location = [property.estate, property.town, property.county, property.country]
    .filter(Boolean)
    .join(", ");

  return `${property.title} is available for ${property.listingType.toLowerCase()} in ${location}. This ${property.propertyType.toLowerCase().replace(/_/g, " ")}${property.bedrooms != null ? ` offers ${property.bedrooms} bedrooms` : ""} in one of Kenya's sought-after neighbourhoods. Contact the seller through Your Home to schedule a viewing or request more details about title verification and payment terms.`;
}

async function getProperty(slug: string, fresh = false) {
  if (fresh) return getPropertyBySlugFresh(slug);
  return getPropertyBySlug(slug);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const session = await auth();
  const result = await getProperty(slug, Boolean(session?.user));

  if (!result) {
    return { title: "Property not found | Your Home" };
  }

  const { property } = result;
  const imageUrl = property.images?.[0]?.url ?? null;

  return generatePropertyMetadata({
    title: property.title,
    description: getPropertyDescription(property),
    slug: property.slug,
    price: property.price,
    currency: property.currency,
    county: property.county,
    town: property.town,
    country: property.country,
    estate: property.estate,
    listingType: property.listingType,
    propertyType: property.propertyType,
    imageUrl,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    publishedAt: property.publishedAt,
  });
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();
  const result = await getProperty(slug, Boolean(session?.user));

  if (!result) notFound();

  const { property } = result;

  if (property.status !== "ACTIVE") {
    const isAdmin = session?.user?.role === "ADMIN";
    const isOwner = session?.user?.id === property.ownerId;
    let isOwnerTeam = false;
    if (session?.user?.id && !isAdmin && !isOwner) {
      try {
        const ctx = await resolveProfessionalActingContext(session.user.id);
        isOwnerTeam = ctx.actingOwnerId === property.ownerId;
      } catch {
        isOwnerTeam = false;
      }
    }
    if (!isAdmin && !isOwner && !isOwnerTeam) {
      notFound();
    }
  }
  const signedIn = Boolean(session?.user);
  const callbackPath = `/properties/${property.slug}`;
  const images = property.images ?? [];
  const propertyVideos =
    "videos" in property && Array.isArray(property.videos)
      ? property.videos
      : [];
  const rentalRooms = (
    "rentalRooms" in property && Array.isArray(property.rentalRooms)
      ? property.rentalRooms
      : []
  ).map((room) => ({
    id: room.id,
    label: room.label,
    floor: room.floor,
    price: room.price,
    status: room.status as "AVAILABLE" | "RENTED",
  }));
  const roomsAvailable = rentalRooms.filter((r) => r.status === "AVAILABLE")
    .length;

  const rawContactPhone = signedIn
    ? property.agent?.user?.phone || property.owner?.phone || null
    : null;
  const hostUserId =
    property.agent?.user?.id ?? property.owner?.id ?? undefined;
  const whatsappPhone = rawContactPhone
    ? toWhatsAppNumber(rawContactPhone)
    : null;
  const callPhone = rawContactPhone
    ? telHref(rawContactPhone).replace(/^tel:/, "")
    : null;
  const whatsappMessage = encodeURIComponent(
    `Hi, I'm interested in ${property.title} on Your Home (${property.slug})`,
  );

  const listingHost = resolveListingHost(property);

  const description = getPropertyDescription(property);
  const [guestReviews, membership] = await Promise.all([
    getPropertyReviews(property.id),
    session?.user?.id
      ? getCustomerMembership(session.user.id)
      : Promise.resolve(null),
  ]);

  const jsonLd = propertyJsonLd({
    id: property.id,
    title: property.title,
    description,
    slug: property.slug,
    price: property.price,
    currency: property.currency,
    county: property.county,
    town: property.town,
    country: property.country,
    estate: property.estate,
    listingType: property.listingType,
    propertyType: property.propertyType,
    imageUrl: images[0]?.url,
    images: images.map((img) => img.url),
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    floorArea: "floorArea" in property ? property.floorArea : null,
    status: property.status,
    publishedAt: property.publishedAt,
  });

  const crumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Properties", path: "/properties" },
    { name: property.county, path: `/properties?county=${encodeURIComponent(property.county)}` },
    { name: property.title, path: `/properties/${property.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([jsonLd, crumbs]),
        }}
      />

      <div className="min-h-dvh bg-background pb-32 lg:pb-0">
        <main className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge>{getListingTypeLabel(property.listingType)}</Badge>
                <Badge variant="outline">
                  {getPropertyTypeLabel(property.propertyType)}
                </Badge>
                {property.isVerified && (
                  <Badge className="bg-primary">Verified listing</Badge>
                )}
              </div>
              <h1 className="break-words text-2xl font-bold sm:text-3xl">
                {property.title}
              </h1>
              {property.rentalPlot ? (
                <p className="mt-1 text-sm text-primary">
                  {property.unitLabel ? `${property.unitLabel} · ` : ""}
                  {property.unitFloor ? `${property.unitFloor} · ` : ""}
                  {property.rentalPlot.name}
                </p>
              ) : null}
              <p className="mt-2 flex items-start gap-1 text-sm text-muted-foreground sm:text-base">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {[property.estate, property.town, property.county, property.country]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-2xl font-bold tabular-nums text-primary sm:text-3xl">
                {formatPrice(property.price, { currency: property.currency })}
                {property.listingType === "RENT" && (
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}
                    / month
                  </span>
                )}
                {isStayListing(property.listingType) && (
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}
                    / night
                  </span>
                )}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 sm:justify-end">
                {guestReviews.count > 0 ? (
                  <Badge className="bg-primary text-primary-foreground">
                    {guestReviews.average.toFixed(1)} {guestReviews.label}
                  </Badge>
                ) : null}
                {property.listingType === "RENT" && rentalRooms.length > 0 ? (
                  <Badge variant="secondary">
                    {roomsAvailable} of {rentalRooms.length} rooms available
                  </Badge>
                ) : null}
                <Button variant="outline" size="sm">
                  <Share2 className="mr-1 h-4 w-4" />
                  Share
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/compare">Compare</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <PropertyDetailGallery
                slug={property.slug}
                title={property.title}
                initialImages={images.map((img) => ({
                  id: img.id,
                  url: img.url,
                  alt: img.alt,
                }))}
                initialVideos={propertyVideos.map((video) => ({
                  id: video.id,
                  url: video.url,
                  title: video.title,
                  thumbnail: video.thumbnail,
                }))}
              />

              {rentalRooms.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Rooms for rent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {rentalRooms.map((room) => (
                        <li
                          key={room.id}
                          className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                        >
                          <span>
                            {room.label}
                            {room.floor ? (
                              <span className="text-muted-foreground">
                                {" "}
                                · Floor {room.floor}
                              </span>
                            ) : null}
                          </span>
                          <Badge
                            variant={
                              room.status === "AVAILABLE"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {room.status === "AVAILABLE" ? "Available" : "Rented"}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs text-muted-foreground">
                      This house stays listed until all rooms are booked.
                    </p>
                  </CardContent>
                </Card>
              ) : null}

              <Tabs defaultValue="description">
                <TabsList className="flex h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto bg-muted p-1">
                  <TabsTrigger value="description" className="shrink-0">
                    Description
                  </TabsTrigger>
                  <TabsTrigger value="amenities" className="shrink-0">
                    Amenities
                  </TabsTrigger>
                  <TabsTrigger value="nearby" className="shrink-0">
                    Nearby
                  </TabsTrigger>
                  <TabsTrigger value="map" className="shrink-0">
                    Map
                  </TabsTrigger>
                </TabsList>
                {!signedIn ? (
                  <div className="mt-4">
                    <SignInToUnlock
                      title="Sign in to see this listing"
                      description="Description, amenities, nearby places, and the map are visible after you sign in."
                      callbackPath={callbackPath}
                    >
                      <div className="space-y-3 p-6">
                        <p className="text-muted-foreground">
                          Full write-up, amenities, nearby places, and the map
                          unlock after you sign in.
                        </p>
                        <p className="text-muted-foreground">
                          Parking · Security · Nearby schools and shops
                        </p>
                        <div className="h-40 rounded-lg bg-muted" />
                      </div>
                    </SignInToUnlock>
                  </div>
                ) : (
                  <>
                <TabsContent value="description" className="mt-4">
                  <Card>
                    <CardContent className="prose max-w-none p-6">
                      {description.split("\n\n").map((para, i) => (
                        <p key={i} className="mb-4 text-muted-foreground">
                          {para}
                        </p>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="amenities" className="mt-4">
                  <Card>
                    <CardContent className="p-6">
                      <ListingFeaturesDisplay
                        amenities={
                          "amenities" in property ? property.amenities : []
                        }
                        parkingSpaces={property.parkingSpaces}
                        listingType={property.listingType}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="nearby" className="mt-4">
                  <Card>
                    <CardContent className="p-6">
                      {"nearbyPlaces" in property && property.nearbyPlaces?.length ? (
                        <ul className="space-y-3">
                          {property.nearbyPlaces.map(
                            (place: {
                              id: string;
                              name: string;
                              type: string;
                              distance?: number | null;
                            }) => (
                              <li key={place.id} className="flex justify-between">
                                <span>
                                  {place.name}{" "}
                                  <span className="text-muted-foreground">
                                    ({place.type})
                                  </span>
                                </span>
                                {place.distance != null && (
                                  <span className="text-sm text-muted-foreground">
                                    {place.distance} km
                                  </span>
                                )}
                              </li>
                            ),
                          )}
                        </ul>
                      ) : (
                        <ul className="space-y-2 text-muted-foreground">
                          <li>• Two Rivers Mall — 2.5 km</li>
                          <li>• Nairobi Hospital — 1.8 km</li>
                          <li>• International School of Kenya — 3.2 km</li>
                          <li>• Expressway interchange — 4.0 km</li>
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="map" className="mt-4">
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <PropertyLocationMap
                        latitude={
                          signedIn && "latitude" in property
                            ? property.latitude
                            : null
                        }
                        longitude={
                          signedIn && "longitude" in property
                            ? property.longitude
                            : null
                        }
                        county={property.county}
                        town={property.town}
                        estate={property.estate}
                        title={property.title}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                  </>
                )}
              </Tabs>

              <div className="flex flex-wrap gap-6 rounded-lg border p-4">
                {property.bedrooms != null && (
                  <span className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-primary" />
                    {property.bedrooms} Bedrooms
                  </span>
                )}
                {property.bathrooms != null && (
                  <span className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-primary" />
                    {property.bathrooms} Bathrooms
                  </span>
                )}
                {"floorArea" in property && property.floorArea != null && (
                  <span>{property.floorArea} m² floor area</span>
                )}
                {"yearBuilt" in property && property.yearBuilt != null && (
                  <span className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Built {property.yearBuilt}
                  </span>
                )}
              </div>

              {property.listingType === "BUY" && (
                <MortgageCalculator propertyPrice={property.price} />
              )}

              <PropertyReviews reviews={guestReviews} />

              <RelatedPropertiesSection slug={slug} county={property.county} />
            </div>

            <aside className="space-y-4 lg:sticky lg:top-20">
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
                      currency={property.currency}
                      hostUserId={hostUserId}
                      memberDiscountRate={membership?.discountRate ?? 0.1}
                    />
                  ) : property.listingType === "RENT" ? (
                    <RentalListingActions
                      propertyId={property.id}
                      propertySlug={property.slug}
                      propertyTitle={property.title}
                      price={property.price}
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
                        listedPrice={property.price}
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
            </aside>
          </div>
        </main>
      </div>
      {property.listingType === "RENT" ? (
        signedIn ? (
        <RentalListingActions
          propertyId={property.id}
          propertySlug={property.slug}
          propertyTitle={property.title}
          price={property.price}
          currency={property.currency}
          hostUserId={hostUserId}
          whatsappPhone={whatsappPhone}
          whatsappMessage={whatsappMessage}
          callPhone={callPhone}
          rooms={rentalRooms}
          sticky
        />
        ) : (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
            <Button asChild className="w-full">
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(callbackPath)}`}
              >
                Sign in to message, WhatsApp, or call
              </Link>
            </Button>
          </div>
        )
      ) : null}
    </>
  );
}
