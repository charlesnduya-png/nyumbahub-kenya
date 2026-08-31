import type { PrismaClient, Role } from "@prisma/client";
import { kenyaDateKey, getKenyaPeriodStarts } from "@/lib/admin-revenue";

export const ACCOUNT_TYPE_LABELS: Record<
  Role,
  { label: string; description: string }
> = {
  BUYER: {
    label: "Tenants",
    description: "People browsing, renting, or buying property",
  },
  AGENT: {
    label: "Agents",
    description: "Licensed agents managing listings and clients",
  },
  SELLER: {
    label: "Landlords & owners",
    description: "Sellers and landlords posting properties",
  },
  ADMIN: {
    label: "Admins",
    description: "Platform administrators",
  },
  JOB_PARTNER: {
    label: "Job partners",
    description: "Referral partners earning hotel plan commissions",
  },
};

export type AccountTypeCounts = Record<Role, number> & { total: number };

export type AdminGrowthSummary = {
  accounts: AccountTypeCounts;
  activeAccounts: AccountTypeCounts;
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;
  newVsLastMonth: number | null;
  activeListings: number;
  newListingsThisMonth: number;
  totalLeads: number;
  newLeadsThisMonth: number;
  signupsLast14Days: Array<{ label: string; dateKey: string; total: number }>;
  signupsByRole14Days: Record<Role, number>;
  monthlySignups: Array<{
    label: string;
    total: number;
    byRole: Record<Role, number>;
  }>;
  monthlyListings: Array<{ label: string; count: number }>;
};

export async function getAccountTypeCounts(
  prisma: PrismaClient,
): Promise<{ total: AccountTypeCounts; active: AccountTypeCounts }> {
  const grouped = await prisma.user.groupBy({
    by: ["role"],
    _count: { _all: true },
  });

  const activeGrouped = await prisma.user.groupBy({
    by: ["role"],
    where: { isActive: true },
    _count: { _all: true },
  });

  const empty = (): AccountTypeCounts => ({
    BUYER: 0,
    SELLER: 0,
    AGENT: 0,
    ADMIN: 0,
    JOB_PARTNER: 0,
    total: 0,
  });

  const total = empty();
  for (const row of grouped) {
    total[row.role] = row._count._all;
    total.total += row._count._all;
  }

  const active = empty();
  for (const row of activeGrouped) {
    active[row.role] = row._count._all;
    active.total += row._count._all;
  }

  return { total, active };
}

export async function getAdminGrowthSummary(
  prisma: PrismaClient,
): Promise<AdminGrowthSummary> {
  const now = new Date();
  const { todayStart, weekStart, monthStart } = getKenyaPeriodStarts(now);
  const prevMonthStart = new Date(monthStart);
  prevMonthStart.setUTCMonth(prevMonthStart.getUTCMonth() - 1);

  const chartStart = new Date(todayStart.getTime() - 13 * 86_400_000);
  const sixMonthsStart = new Date(monthStart);
  sixMonthsStart.setUTCMonth(sixMonthsStart.getUTCMonth() - 5);

  const [
    { total: accounts, active: activeAccounts },
    newToday,
    newThisWeek,
    newThisMonth,
    newLastMonth,
    activeListings,
    newListingsThisMonth,
    totalLeads,
    newLeadsThisMonth,
    recentUsers,
    monthUsers,
    monthListings,
  ] = await Promise.all([
    getAccountTypeCounts(prisma),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.user.count({
      where: { createdAt: { gte: prevMonthStart, lt: monthStart } },
    }),
    prisma.property.count({ where: { status: "ACTIVE" } }),
    prisma.property.count({
      where: { createdAt: { gte: monthStart }, status: { not: "DRAFT" } },
    }),
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.user.findMany({
      where: { createdAt: { gte: chartStart } },
      select: { createdAt: true, role: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: sixMonthsStart } },
      select: { createdAt: true, role: true },
    }),
    prisma.property.findMany({
      where: { createdAt: { gte: sixMonthsStart } },
      select: { createdAt: true },
    }),
  ]);

  const signupsLast14Days: AdminGrowthSummary["signupsLast14Days"] = [];
  for (let i = 13; i >= 0; i--) {
    const dayStart = new Date(todayStart.getTime() - i * 86_400_000);
    const key = kenyaDateKey(dayStart);
    signupsLast14Days.push({
      dateKey: key,
      label: dayStart.toLocaleDateString("en-KE", {
        timeZone: "Africa/Nairobi",
        month: "short",
        day: "numeric",
      }),
      total: 0,
    });
  }

  const dayIndex = new Map(signupsLast14Days.map((d, i) => [d.dateKey, i]));
  const signupsByRole14Days: Record<Role, number> = {
    BUYER: 0,
    SELLER: 0,
    AGENT: 0,
    ADMIN: 0,
    JOB_PARTNER: 0,
  };

  for (const u of recentUsers) {
    const key = kenyaDateKey(u.createdAt);
    const idx = dayIndex.get(key);
    if (idx !== undefined) {
      signupsLast14Days[idx].total += 1;
    }
    signupsByRole14Days[u.role] += 1;
  }

  const [curYear, curMonth] = kenyaDateKey(now).split("-").map(Number);
  const monthKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    let m = curMonth - i;
    let y = curYear;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    monthKeys.push(`${y}-${String(m).padStart(2, "0")}`);
  }

  const monthlySignupsMap = new Map<
    string,
    { total: number; byRole: Record<Role, number> }
  >();
  for (const key of monthKeys) {
    monthlySignupsMap.set(key, {
      total: 0,
      byRole: { BUYER: 0, SELLER: 0, AGENT: 0, ADMIN: 0, JOB_PARTNER: 0 },
    });
  }

  for (const u of monthUsers) {
    const key = u.createdAt
      .toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" })
      .slice(0, 7);
    const bucket = monthlySignupsMap.get(key);
    if (bucket) {
      bucket.total += 1;
      bucket.byRole[u.role] += 1;
    }
  }

  const monthlySignups = monthKeys.map((key) => {
    const bucket = monthlySignupsMap.get(key)!;
    const [y, m] = key.split("-").map(Number);
    const label = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-KE", {
      month: "short",
      year: "numeric",
    });
    return { label, total: bucket.total, byRole: bucket.byRole };
  });

  const monthlyListingsMap = new Map<string, number>();
  for (const key of monthKeys) {
    monthlyListingsMap.set(key, 0);
  }
  for (const p of monthListings) {
    const key = p.createdAt
      .toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" })
      .slice(0, 7);
    if (monthlyListingsMap.has(key)) {
      monthlyListingsMap.set(key, (monthlyListingsMap.get(key) ?? 0) + 1);
    }
  }

  const monthlyListings = monthKeys.map((key) => {
    const [y, m] = key.split("-").map(Number);
    const label = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-KE", {
      month: "short",
      year: "numeric",
    });
    return { label, count: monthlyListingsMap.get(key) ?? 0 };
  });

  return {
    accounts,
    activeAccounts,
    newToday,
    newThisWeek,
    newThisMonth,
    newVsLastMonth:
      newLastMonth > 0
        ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100)
        : newThisMonth > 0
          ? 100
          : null,
    activeListings,
    newListingsThisMonth,
    totalLeads,
    newLeadsThisMonth,
    signupsLast14Days,
    signupsByRole14Days,
    monthlySignups,
    monthlyListings,
  };
}
