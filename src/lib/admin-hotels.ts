import { prisma } from "@/lib/prisma";
import { HOTEL_PLANS } from "@/lib/hotel-plans";
import { HOTEL_SERVICE_SECTIONS } from "@/lib/hotel-services";

export type AdminHotelsDashboardData = {
  stats: {
    hotelListings: number;
    activeHotels: number;
    pendingHotels: number;
    totalBookings: number;
    pendingBookings: number;
    approvedBookings: number;
    activePackages: number;
    totalPackages: number;
    openRequests: number;
    totalRequests: number;
    paidPlans: number;
    planRevenueKes: number;
  };
  planTiers: { tier: string; count: number }[];
  serviceCounts: { key: string; label: string; slug: string; packages: number; requests: number }[];
  recentBookings: {
    id: string;
    status: string;
    totalAmount: number;
    currency: string;
    createdAt: string;
    propertyTitle: string;
    guestName: string | null;
    ownerName: string | null;
  }[];
  recentRequests: {
    id: string;
    category: string;
    status: string;
    contactName: string;
    organization: string | null;
    createdAt: string;
    ownerName: string | null;
  }[];
};

export async function getAdminHotelsDashboard(): Promise<AdminHotelsDashboardData> {
  const hotelWhere = { listingType: "HOTEL" as const };

  const [
    hotelListings,
    activeHotels,
    pendingHotels,
    totalBookings,
    pendingBookings,
    approvedBookings,
    totalPackages,
    activePackages,
    totalRequests,
    openRequests,
    paidPlans,
    planTierGroups,
    packageByCategory,
    requestByCategory,
    recentBookings,
    recentRequests,
    hotelPlanPayments,
  ] = await Promise.all([
    prisma.property.count({ where: hotelWhere }),
    prisma.property.count({ where: { ...hotelWhere, status: "ACTIVE" } }),
    prisma.property.count({ where: { ...hotelWhere, status: "PENDING" } }),
    prisma.booking.count({ where: { property: hotelWhere } }),
    prisma.booking.count({
      where: { property: hotelWhere, status: "PENDING" },
    }),
    prisma.booking.count({
      where: {
        property: hotelWhere,
        status: { in: ["APPROVED", "COMPLETED"] },
      },
    }),
    prisma.hotelPackage.count(),
    prisma.hotelPackage.count({ where: { isActive: true } }),
    prisma.hotelServiceRequest.count(),
    prisma.hotelServiceRequest.count({
      where: { status: { in: ["NEW", "REVIEWING", "QUOTED"] } },
    }),
    prisma.hotelAccountPlan.count({ where: { tier: { not: "FREE" } } }),
    prisma.hotelAccountPlan.groupBy({
      by: ["tier"],
      _count: { tier: true },
    }),
    prisma.hotelPackage.groupBy({
      by: ["category"],
      _count: { category: true },
    }),
    prisma.hotelServiceRequest.groupBy({
      by: ["category"],
      _count: { category: true },
    }),
    prisma.booking.findMany({
      where: { property: hotelWhere },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        property: { select: { title: true, owner: { select: { name: true } } } },
        guest: { select: { name: true } },
      },
    }),
    prisma.hotelServiceRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        owner: { select: { name: true } },
      },
    }),
    prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        OR: [
          { description: { contains: "Hotel", mode: "insensitive" } },
          { description: { contains: "hotel_plan", mode: "insensitive" } },
        ],
      },
      select: { amount: true, metadata: true, description: true },
    }),
  ]);

  const planRevenueKes = hotelPlanPayments
    .filter((p) => {
      const meta = p.metadata as { productId?: string } | null;
      return (
        meta?.productId?.startsWith("hotel_plan_") ||
        p.description?.toLowerCase().includes("hotel")
      );
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const pkgMap = new Map(packageByCategory.map((r) => [r.category, r._count.category]));
  const reqMap = new Map(requestByCategory.map((r) => [r.category, r._count.category]));

  const serviceCounts = HOTEL_SERVICE_SECTIONS.map((section) => ({
    key: section.key,
    label: section.label,
    slug: section.slug,
    packages: pkgMap.get(section.key) ?? 0,
    requests: reqMap.get(section.key) ?? 0,
  }));

  const tierLabels = Object.fromEntries(HOTEL_PLANS.map((p) => [p.id, p.name]));

  return {
    stats: {
      hotelListings,
      activeHotels,
      pendingHotels,
      totalBookings,
      pendingBookings,
      approvedBookings,
      activePackages,
      totalPackages,
      openRequests,
      totalRequests,
      paidPlans,
      planRevenueKes,
    },
    planTiers: planTierGroups.map((row) => ({
      tier: tierLabels[row.tier] ?? row.tier,
      count: row._count.tier,
    })),
    serviceCounts,
    recentBookings: recentBookings.map((b) => ({
      id: b.id,
      status: b.status,
      totalAmount: b.totalAmount,
      currency: b.currency,
      createdAt: b.createdAt.toISOString(),
      propertyTitle: b.property.title,
      guestName: b.guest?.name ?? null,
      ownerName: b.property.owner.name,
    })),
    recentRequests: recentRequests.map((r) => ({
      id: r.id,
      category: r.category,
      status: r.status,
      contactName: r.contactName,
      organization: r.organization,
      createdAt: r.createdAt.toISOString(),
      ownerName: r.owner.name,
    })),
  };
}

export async function getAdminHotelPlans() {
  return prisma.hotelAccountPlan.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}
