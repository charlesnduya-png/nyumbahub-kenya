import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Bath,
  Bed,
  Calendar,
  Check,
  MapPin,
  MessageCircle,
  ParkingCircle,
  Share2,
  Shield,
  Waves,
} from "lucide-react";
import { ContactSellerForm } from "@/components/properties/contact-seller-form";
import { MortgageCalculator } from "@/components/properties/mortgage-calculator";
import { PropertyCardItem } from "@/components/properties/property-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getMockPropertyBySlug,
  mockProperties,
} from "@/data/mock";
import { prisma } from "@/lib/prisma";
import {
  generatePropertyMetadata,
  propertyJsonLd,
} from "@/lib/seo";
import { formatPrice } from "@/lib/utils";
import { getListingTypeLabel, getPropertyTypeLabel } from "@/lib/kenya";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function getPropertyDescription(property: {
  title: string;
  description?: string;
  town: string;
  county: string;
  estate?: string | null;
  listingType: string;
  propertyType: string;
  bedrooms?: number | null;
}): string {
  if ("description" in property && property.description) {
    return property.description;
  }

  const location = [property.estate, property.town, property.county]
    .filter(Boolean)
    .join(", ");

  return `${property.title} is available for ${property.listingType.toLowerCase()} in ${location}. This ${property.propertyType.toLowerCase().replace(/_/g, " ")}${property.bedrooms != null ? ` offers ${property.bedrooms} bedrooms` : ""} in one of Kenya's sought-after neighbourhoods. Contact the seller through NyumbaHub to schedule a viewing or request more details about title verification and payment terms.`;
}

async function getProperty(slug: string) {
  try {
    const property = await prisma.property.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { order: "asc" } },
        videos: true,
        amenities: { include: { amenity: true } },
        nearbyPlaces: true,
        owner: { select: { id: true, name: true, phone: true, image: true } },
        agent: {
          include: {
            user: { select: { id: true, name: true, phone: true, image: true } },
          },
        },
      },
    });

    if (property) return { property, fallback: false };
  } catch {
    // use mock
  }

  const mock = getMockPropertyBySlug(slug);
  if (mock) return { property: mock, fallback: true };

  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProperty(slug);

  if (!result) {
    return { title: "Property not found | NyumbaHub Kenya" };
  }

  const { property } = result;
  const imageUrl =
    property.images?.[0]?.url ??
    ("primaryImage" in property ? property.primaryImage?.url : null);

  return generatePropertyMetadata({
    title: property.title,
    description: getPropertyDescription(property),
    slug: property.slug,
    price: property.price,
    currency: property.currency,
    county: property.county,
    town: property.town,
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
  const result = await getProperty(slug);

  if (!result) notFound();

  const { property, fallback } = result;
  const images =
    property.images?.length
      ? property.images
      : "primaryImage" in property && property.primaryImage
        ? [property.primaryImage]
        : [];

  const related = mockProperties
    .filter((p) => p.slug !== slug && p.county === property.county)
    .slice(0, 3);

  const whatsappPhone = "254712345678";
  const whatsappMessage = encodeURIComponent(
    `Hi, I'm interested in ${property.title} on NyumbaHub Kenya (${property.slug})`,
  );

  const description = getPropertyDescription(property);

  const jsonLd = propertyJsonLd({
    id: property.id,
    title: property.title,
    description,
    slug: property.slug,
    price: property.price,
    currency: property.currency,
    county: property.county,
    town: property.town,
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <Link href="/" className="text-xl font-bold text-primary">
              NyumbaHub Kenya
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/properties">Properties</Link>
              <Link href="/agents">Agents</Link>
              <Link href="/wishlist">Wishlist</Link>
            </nav>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {fallback && (
            <Badge variant="secondary" className="mb-4">
              Sample listing — connect database for live data
            </Badge>
          )}

          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge>{getListingTypeLabel(property.listingType)}</Badge>
                <Badge variant="outline">
                  {getPropertyTypeLabel(property.propertyType)}
                </Badge>
                {property.isVerified && (
                  <Badge className="bg-primary">Verified listing</Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold">{property.title}</h1>
              <p className="mt-2 flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {[property.estate, property.town, property.county]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">
                {formatPrice(property.price, { currency: property.currency })}
                {property.listingType === "RENT" && (
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}
                    / month
                  </span>
                )}
                {property.listingType === "HOLIDAY" && (
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}
                    / night
                  </span>
                )}
              </p>
              <div className="mt-2 flex gap-2">
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
              <div className="grid gap-2 sm:grid-cols-2">
                {images.length > 0 ? (
                  images.map((img, i) => (
                    <div
                      key={img.id}
                      className={`relative overflow-hidden rounded-lg bg-muted ${
                        i === 0 ? "sm:col-span-2 aspect-[16/9]" : "aspect-[4/3]"
                      }`}
                    >
                      <Image
                        src={img.url}
                        alt={img.alt ?? property.title}
                        fill
                        className="object-cover"
                        priority={i === 0}
                      />
                    </div>
                  ))
                ) : (
                  <div className="sm:col-span-2 aspect-[16/9] rounded-lg bg-muted" />
                )}
              </div>

              <Tabs defaultValue="description">
                <TabsList>
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="amenities">Amenities</TabsTrigger>
                  <TabsTrigger value="nearby">Nearby</TabsTrigger>
                  <TabsTrigger value="map">Map</TabsTrigger>
                </TabsList>
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
                    <CardContent className="grid gap-3 p-6 sm:grid-cols-2">
                      {property.furnished && (
                        <span className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" /> Furnished
                        </span>
                      )}
                      {property.swimmingPool && (
                        <span className="flex items-center gap-2">
                          <Waves className="h-4 w-4 text-primary" /> Swimming pool
                        </span>
                      )}
                      {property.security && (
                        <span className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" /> 24/7 Security
                        </span>
                      )}
                      {property.parkingSpaces > 0 && (
                        <span className="flex items-center gap-2">
                          <ParkingCircle className="h-4 w-4 text-primary" />{" "}
                          {property.parkingSpaces} parking space
                          {property.parkingSpaces > 1 ? "s" : ""}
                        </span>
                      )}
                      {"amenities" in property &&
                        property.amenities?.map((pa: { amenity: { name: string } }) => (
                          <span key={pa.amenity.name} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary" />
                            {pa.amenity.name}
                          </span>
                        ))}
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
                    <CardContent className="flex aspect-video items-center justify-center bg-muted p-6">
                      <div className="text-center text-muted-foreground">
                        <MapPin className="mx-auto mb-2 h-8 w-8" />
                        <p>Map view — {property.town}, {property.county}</p>
                        <p className="text-sm">
                          Integrate Google Maps or Mapbox with coordinates
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
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

              {related.length > 0 && (
                <section>
                  <h2 className="mb-4 text-xl font-semibold">Similar properties</h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {related.map((p) => (
                      <PropertyCardItem key={p.id} property={p} />
                    ))}
                  </div>
                </section>
              )}
            </div>

            <aside className="space-y-4">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Interested in this property?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ContactSellerForm
                    propertyId={property.id}
                    propertyTitle={property.title}
                  />
                  <Button variant="outline" className="w-full" asChild>
                    <a
                      href={`https://wa.me/${whatsappPhone}?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp agent
                    </a>
                  </Button>
                  <Button variant="secondary" className="w-full">
                    Book a viewing
                  </Button>
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
    </>
  );
}
