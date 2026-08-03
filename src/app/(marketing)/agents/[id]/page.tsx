import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, MapPin, BadgeCheck, Phone } from "lucide-react";
import { mockAgents } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getAgent(id: string) {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, image: true, email: true, phone: true } },
        listings: {
          where: { status: "ACTIVE" },
          take: 6,
          include: { images: { where: { isPrimary: true }, take: 1 } },
        },
      },
    });

    if (agent) return { type: "db" as const, agent };
  } catch {
    // fallback
  }

  const mock = mockAgents.find((a) => a.id === id || a.slug === id);
  if (mock) return { type: "mock" as const, agent: mock };

  return null;
}

export default async function AgentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getAgent(id);

  if (!result) notFound();

  if (result.type === "db") {
    const { agent } = result;
    const name = agent.user?.name ?? "Agent";

    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <Link href="/agents" className="text-sm text-primary hover:underline">
              ← All agents
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-start gap-6">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-muted">
                  {agent.user?.image ? (
                    <Image src={agent.user.image} alt={name} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-primary">
                      {name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{name}</h1>
                    {agent.isVerified && <BadgeCheck className="h-5 w-5 text-primary" />}
                  </div>
                  <p className="text-muted-foreground">{agent.agencyName}</p>
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      {agent.rating} ({agent.reviewCount} reviews)
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {agent.town}, {agent.county}
                    </span>
                  </div>
                </div>
              </div>
              {agent.bio && (
                <Card>
                  <CardHeader><CardTitle>About</CardTitle></CardHeader>
                  <CardContent><p className="text-muted-foreground">{agent.bio}</p></CardContent>
                </Card>
              )}
            </div>
            <aside>
              <Card className="sticky top-24">
                <CardHeader><CardTitle>Contact agent</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {agent.user?.phone && (
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href={`tel:${agent.user.phone}`}>
                        <Phone className="mr-2 h-4 w-4" />
                        {agent.user.phone}
                      </a>
                    </Button>
                  )}
                  <Button className="w-full" asChild>
                    <Link href="/properties">Browse listings</Link>
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </div>
        </main>
      </div>
    );
  }

  const agent = result.agent;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link href="/agents" className="text-sm text-primary hover:underline">
            ← All agents
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-start gap-6">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-muted">
                <Image src={agent.image} alt={agent.name} fill className="object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{agent.name}</h1>
                  <BadgeCheck className="h-5 w-5 text-primary" />
                </div>
                <p className="text-muted-foreground">{agent.agency}</p>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {agent.rating} ({agent.reviewCount} reviews)
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {agent.county}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {agent.specialties.map((s) => (
                    <Badge key={s} variant="outline">{s}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <Card>
              <CardHeader><CardTitle>About</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {agent.name} is a licensed agent with {agent.agency}, specialising in{" "}
                  {agent.specialties.join(", ")} across {agent.county}. Currently managing{" "}
                  {agent.listingsCount} active listings on NyumbaHub Kenya.
                </p>
              </CardContent>
            </Card>
          </div>
          <aside>
            <Card className="sticky top-24">
              <CardHeader><CardTitle>Contact agent</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" asChild>
                  <Link href="/properties">Browse listings</Link>
                </Button>
                <p className="text-sm text-muted-foreground">
                  {agent.listingsCount} active listings · {agent.reviewCount} client reviews
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
