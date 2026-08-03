import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, BadgeCheck } from "lucide-react";
import { listDemoAgents } from "@/lib/agents-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

async function getAgents() {
  try {
    const agents = await prisma.agent.findMany({
      include: {
        user: { select: { id: true, name: true, image: true, email: true } },
      },
      orderBy: [{ isFeatured: "desc" }, { rating: "desc" }],
      take: 24,
    });

    if (agents.length > 0) {
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
      }));
    }
  } catch {
    // fallback
  }

  return listDemoAgents().map((a) => ({
    id: a.id,
    name: a.name,
    agencyName: a.agency,
    specialty: a.specialties.join(", "),
    yearsExperience: 5,
    rating: a.rating,
    reviewCount: a.reviewCount,
    county: a.county,
    town: a.county,
    isFeatured: a.isFeatured,
    isVerified: a.isVerified,
    image: a.image,
  }));
}

export default async function AgentsPage() {
  const agents = await getAgents();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-primary">
            NyumbaHub Kenya
          </Link>
          <Link href="/properties" className="text-sm text-muted-foreground hover:text-foreground">
            Browse properties
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Licensed Real Estate Agents</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Connect with EARB-verified agents across Nairobi, Mombasa, Nakuru, and
            beyond. Every agent profile includes ratings from verified transactions.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
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
                        <BadgeCheck className="h-4 w-4 text-primary" />
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
                {agent.specialty && (
                  <Badge variant="secondary" className="mt-3">
                    {agent.specialty}
                  </Badge>
                )}
                <p className="mt-3 text-sm text-muted-foreground">
                  {agent.yearsExperience} years experience
                </p>
                <Button asChild className="mt-4 w-full" variant="outline">
                  <Link href={`/agents/${agent.id}`}>View profile</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
