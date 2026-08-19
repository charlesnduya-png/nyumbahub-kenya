import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Star, MapPin, BadgeCheck, Phone, MessageCircle } from "lucide-react";
import { PropertyCardItem } from "@/components/properties/property-card";
import { AgentSocialLinks } from "@/components/agents/agent-social-links";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatKenyanPhone,
  telHref,
  toWhatsAppNumber,
} from "@/lib/phone";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildPageMetadata, generateAgentMetadata } from "@/lib/seo";
import { ReportAgentDialog } from "@/components/agents/report-agent-dialog";
import type { PropertyCard } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getAgentForMetadata(id: string) {
  try {
    return await prisma.agent.findUnique({
      where: { id },
      select: {
        id: true,
        agencyName: true,
        county: true,
        town: true,
        user: { select: { name: true, image: true } },
      },
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const agent = await getAgentForMetadata(id);

  if (!agent) {
    return buildPageMetadata({
      title: "Real Estate Agent Kenya",
      description:
        "Browse verified estate agents and property listings across Kenya on Your Home.",
      path: `/agents/${id}`,
    });
  }

  return generateAgentMetadata({
    id: agent.id,
    name: agent.user?.name ?? "Agent",
    agencyName: agent.agencyName,
    county: agent.county,
    town: agent.town,
    image: agent.user?.image,
  });
}

function listingToCard(listing: {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  listingType: PropertyCard["listingType"];
  propertyType: PropertyCard["propertyType"];
  status: PropertyCard["status"];
  bedrooms: number | null;
  bathrooms: number | null;
  county: string;
  town: string;
  estate: string | null;
  parkingSpaces: number | null;
  furnished: boolean;
  swimmingPool: boolean;
  security: boolean;
  isFeatured: boolean;
  isPremium: boolean;
  isVerified: boolean;
  views: number;
  publishedAt: Date | null;
  images: { id: string; url: string; isPrimary: boolean; order: number }[];
}): PropertyCard {
  const primary =
    listing.images.find((i) => i.isPrimary) ?? listing.images[0] ?? null;

  return {
    id: listing.id,
    title: listing.title,
    slug: listing.slug,
    price: listing.price,
    currency: listing.currency,
    listingType: listing.listingType,
    propertyType: listing.propertyType,
    status: listing.status,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    county: listing.county,
    town: listing.town,
    estate: listing.estate,
    parkingSpaces: listing.parkingSpaces ?? 0,
    furnished: listing.furnished,
    swimmingPool: listing.swimmingPool,
    security: listing.security,
    isFeatured: listing.isFeatured,
    isPremium: listing.isPremium,
    isVerified: listing.isVerified,
    views: listing.views,
    publishedAt: listing.publishedAt,
    primaryImage: primary,
    images: listing.images,
  };
}

async function getAgent(id: string) {
  try {
    return await prisma.agent.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, image: true, email: true, phone: true, bio: true },
        },
        listings: {
          where: { status: "ACTIVE" },
          take: 12,
          orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
          include: {
            images: { orderBy: { order: "asc" } },
          },
        },
        _count: { select: { listings: { where: { status: "ACTIVE" } } } },
      },
    });
  } catch {
    return null;
  }
}

export default async function AgentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [agent, session] = await Promise.all([getAgent(id), auth()]);

  if (!agent) notFound();

  const name = agent.user?.name ?? "Agent";
  const phone = agent.user?.phone ?? null;
  const wa = phone ? toWhatsAppNumber(phone) : null;
  const showListings = agent.isFeatured || agent.isVerified;
  const listingCards = showListings ? agent.listings.map(listingToCard) : [];
  const totalListings = agent._count.listings;

  return (
    <div className="min-h-dvh bg-background">
      <main className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Link
          href="/agents"
          className="mb-4 inline-block text-sm text-primary hover:underline"
        >
          ← All agents
        </Link>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted sm:h-24 sm:w-24">
                {agent.user?.image ? (
                  <Image src={agent.user.image} alt={name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-primary">
                    {name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold sm:text-2xl">{name}</h1>
                  {agent.isVerified && (
                    <Badge className="gap-1 bg-primary text-primary-foreground">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Verified
                    </Badge>
                  )}
                  {agent.isFeatured && (
                    <Badge variant="secondary">Featured</Badge>
                  )}
                </div>
                <p className="text-muted-foreground">{agent.agencyName}</p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {agent.rating} ({agent.reviewCount} reviews)
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {agent.town}, {agent.county}
                  </span>
                </div>
                {phone ? (
                  <a
                    href={telHref(phone)}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    {formatKenyanPhone(phone)}
                  </a>
                ) : null}
                <AgentSocialLinks
                  className="mt-3"
                  size="sm"
                  website={agent.website}
                  facebookUrl={agent.facebookUrl}
                  instagramUrl={agent.instagramUrl}
                  linkedinUrl={agent.linkedinUrl}
                  twitterUrl={agent.twitterUrl}
                  tiktokUrl={agent.tiktokUrl}
                />
              </div>
            </div>
            {(agent.bio || agent.user?.bio) && (
              <Card>
                <CardHeader><CardTitle>About</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {agent.bio || agent.user?.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            {showListings ? (
              <section id="listings" className="scroll-mt-24 space-y-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">Listings by {name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {totalListings} active listing{totalListings === 1 ? "" : "s"} on Your Home
                    </p>
                  </div>
                  {totalListings > listingCards.length ? (
                    <Button variant="outline" asChild>
                      <Link href={`/properties?agentId=${agent.id}`}>
                        View all
                      </Link>
                    </Button>
                  ) : null}
                </div>
                {listingCards.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {listingCards.map((property) => (
                      <PropertyCardItem key={property.id} property={property} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No active listings yet. Check back soon or contact the agent directly.
                  </p>
                )}
              </section>
            ) : null}
          </div>
          <aside>
            <Card className="lg:sticky lg:top-20">
              <CardHeader><CardTitle>Contact agent</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {phone ? (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={telHref(phone)}>
                      <Phone className="mr-2 h-4 w-4" />
                      {formatKenyanPhone(phone)}
                    </a>
                  </Button>
                ) : null}
                {wa ? (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a
                      href={`https://wa.me/${wa}?text=${encodeURIComponent(
                        `Hi ${name}, I found you on Your Home and would like to discuss a property.`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </a>
                  </Button>
                ) : null}
                <AgentSocialLinks
                  website={agent.website}
                  facebookUrl={agent.facebookUrl}
                  instagramUrl={agent.instagramUrl}
                  linkedinUrl={agent.linkedinUrl}
                  twitterUrl={agent.twitterUrl}
                  tiktokUrl={agent.tiktokUrl}
                />
                {showListings ? (
                  <Button className="w-full" asChild>
                    <Link href={`/properties?agentId=${agent.id}`}>
                      View all listings
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full" asChild>
                    <Link href="/properties">Browse listings</Link>
                  </Button>
                )}
                <p className="text-sm text-muted-foreground">
                  {totalListings} active listings · {agent.reviewCount} client reviews
                </p>
                <ReportAgentDialog
                  agentId={agent.id}
                  agentName={name}
                  isLoggedIn={Boolean(session?.user?.id)}
                />
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
