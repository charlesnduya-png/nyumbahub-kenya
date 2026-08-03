import { getFeaturedDemoAgents, type DemoAgent } from "@/lib/agents-store";
import { prisma } from "@/lib/prisma";
import type { MockAgent } from "@/data/mock";

function toMockAgent(agent: DemoAgent): MockAgent {
  return {
    id: agent.id,
    name: agent.name,
    slug: agent.slug,
    agency: agent.agency,
    county: agent.county,
    rating: agent.rating,
    reviewCount: agent.reviewCount,
    listingsCount: agent.listingsCount,
    image: agent.image,
    specialties: agent.specialties,
  };
}

/**
 * Homepage featured agents: admin-flagged only.
 * Falls back to the demo store when Postgres is offline.
 */
export async function getFeaturedAgentsForHome(limit = 4): Promise<MockAgent[]> {
  try {
    const agents = await prisma.agent.findMany({
      where: { isFeatured: true },
      include: {
        user: { select: { name: true, image: true } },
        _count: { select: { listings: true } },
      },
      orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
      take: limit,
    });

    if (agents.length > 0) {
      return agents.map((a) => ({
        id: a.id,
        name: a.user.name ?? "Agent",
        slug: a.id,
        agency: a.agencyName ?? "Independent",
        county: a.county ?? "Kenya",
        rating: a.rating,
        reviewCount: a.reviewCount,
        listingsCount: a._count.listings,
        image:
          a.user.image ??
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
        specialties: a.specialty
          ? a.specialty.split(",").map((s) => s.trim()).filter(Boolean)
          : ["Residential"],
      }));
    }
  } catch {
    // demo fallback
  }

  return getFeaturedDemoAgents(limit).map(toMockAgent);
}
