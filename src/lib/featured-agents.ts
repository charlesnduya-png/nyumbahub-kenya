import { prisma } from "@/lib/prisma";
import type { FeaturedAgent } from "@/types/agent";

/**
 * Homepage featured agents: admin-flagged only.
 */
export async function getFeaturedAgentsForHome(
  limit = 4,
): Promise<FeaturedAgent[]> {
  try {
    const agents = await prisma.agent.findMany({
      where: { isFeatured: true },
      include: {
        user: { select: { name: true, image: true, phone: true } },
        _count: { select: { listings: { where: { status: "ACTIVE" } } } },
      },
      orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
      take: limit,
    });

    return agents.map((a) => ({
      id: a.id,
      name: a.user.name ?? "Agent",
      slug: a.id,
      agency: a.agencyName ?? "Independent",
      county: a.county ?? "Kenya",
      rating: a.rating,
      reviewCount: a.reviewCount,
      listingsCount: a._count.listings,
      image: a.user.image,
      specialties: a.specialty
        ? a.specialty.split(",").map((s) => s.trim()).filter(Boolean)
        : ["Residential"],
      phone: a.user.phone ?? undefined,
      showListings: true,
    }));
  } catch {
    return [];
  }
}
