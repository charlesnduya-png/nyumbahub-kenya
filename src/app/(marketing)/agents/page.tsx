import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, BadgeCheck, Phone } from "lucide-react";
import { formatKenyanPhone, telHref } from "@/lib/phone";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Licensed Real Estate Agents in Kenya",
  description:
    "Find verified estate agents across Nairobi, Mombasa, Nakuru and Kenya. Call directly or browse their active property listings on Your Home.",
  path: "/agents",
  keywords: [
    "real estate agents Kenya",
    "EARB agents Nairobi",
    "property agents Kenya",
    "estate agents Mombasa",
  ],
});

async function getAgents() {
  try {
    const agents = await prisma.agent.findMany({
      include: {
        user: {
          select: { id: true, name: true, image: true, email: true, phone: true },
        },
        _count: { select: { listings: { where: { status: "ACTIVE" } } } },
      },
      orderBy: [{ isFeatured: "desc" }, { rating: "desc" }],
      take: 24,
    });

    return agents.map((a) => ({
      id: a.id,
      name: a.user.name ?? "Agent",
      agencyName: a.agencyName,
      specialty: a.specialty,
      yearsExperience: a.yearsExperience,
      rating: a.rating,
      reviewCount: a.reviewCount,
      county: a.county,
      town: a.town,
      isFeatured: a.isFeatured,
      isVerified: a.isVerified,
      image: a.user.image,
      phone: a.user.phone,
      listingsCount: a._count.listings,
      showListings: a.isFeatured || a.isVerified,
    }));
  } catch {
    return [];
  }
}

export default async function AgentsPage() {
  const [agents, session] = await Promise.all([getAgents(), auth()]);
  const signedIn = Boolean(session?.user);
  const directory = agents.map((agent) => ({
    ...agent,
    phone: signedIn ? agent.phone : null,
  }));

  return (
    <div className="min-h-dvh bg-background">
      <main className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl">Licensed Real Estate Agents</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Connect with EARB-verified agents across Nairobi, Mombasa, Nakuru, and
            beyond. Call them directly or open listings from featured agents.
          </p>
        </div>

        {agents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No agents registered yet. Check back soon or register as an agent to join the directory.
              </p>
              <Button asChild className="mt-4">
                <Link href="/register">Register as an agent</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {directory.map((agent) => (
              <Card key={agent.id} className="overflow-hidden transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
                      {agent.image ? (
                        <Image
                          src={agent.image}
                          alt={agent.name ?? "Agent"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl font-bold text-primary">
                          {(agent.name ?? "A").charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold">{agent.name}</h2>
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
                      <p className="text-sm text-muted-foreground">
                        {agent.agencyName}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{agent.rating}</span>
                        <span className="text-muted-foreground">
                          ({agent.reviewCount} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {agent.town}, {agent.county}
                  </p>
                  {signedIn && agent.phone ? (
                    <a
                      href={telHref(agent.phone)}
                      className="mt-3 flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {formatKenyanPhone(agent.phone)}
                    </a>
                  ) : null}
                  {agent.specialty && (
                    <Badge variant="secondary" className="mt-3">
                      {agent.specialty}
                    </Badge>
                  )}
                  <p className="mt-3 text-sm text-muted-foreground">
                    {agent.yearsExperience} years experience
                    {agent.listingsCount > 0
                      ? ` · ${agent.listingsCount} active listings`
                      : null}
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    <Button asChild className="w-full" variant="outline">
                      <Link href={`/agents/${agent.id}`}>View profile</Link>
                    </Button>
                    {agent.showListings ? (
                      <Button asChild className="w-full">
                        <Link href={`/agents/${agent.id}#listings`}>
                          View listings
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
