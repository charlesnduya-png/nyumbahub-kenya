import type { PrismaClient } from "@prisma/client";

const KENYA_TZ = "Africa/Nairobi";

export function kenyaDateKey(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: KENYA_TZ });
}

function kenyaMidnight(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00+03:00`);
}

export function getKenyaPeriodStarts(now = new Date()) {
  const dateKey = kenyaDateKey(now);
  const todayStart = kenyaMidnight(dateKey);

  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: KENYA_TZ,
    weekday: "short",
  }).format(now);
  const daysSinceMonday: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  const weekStart = new Date(
    todayStart.getTime() - (daysSinceMonday[weekday] ?? 0) * 86_400_000,
  );

  const [year, month] = dateKey.split("-").map(Number);
  const monthStart = kenyaMidnight(
    `${year}-${String(month).padStart(2, "0")}-01`,
  );

  return { todayStart, weekStart, monthStart };
}

function sumWhere(
  prisma: PrismaClient,
  where: { createdAt?: { gte?: Date; lt?: Date } },
) {
  return prisma.payment.aggregate({
    where: { status: "COMPLETED", ...where },
    _sum: { amount: true },
    _count: { _all: true },
  });
}

export function formatKesProfit(amount: number): string {
  if (amount >= 1_000_000) {
    return `KES ${(amount / 1_000_000).toFixed(1)}M`;
  }
  return `KES ${amount.toLocaleString("en-KE")}`;
}

export type AdminRevenueSummary = {
  daily: number;
  weekly: number;
  monthly: number;
  allTime: number;
  dailyPayments: number;
  weeklyPayments: number;
  monthlyPayments: number;
  dailyVsYesterday: number | null;
  weeklyVsLastWeek: number | null;
  monthlyVsLastMonth: number | null;
  last14Days: Array<{ label: string; dateKey: string; amount: number }>;
  last6Months: Array<{ label: string; amount: number }>;
};

export async function getAdminRevenueSummary(
  prisma: PrismaClient,
): Promise<AdminRevenueSummary> {
  const now = new Date();
  const { todayStart, weekStart, monthStart } = getKenyaPeriodStarts(now);
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
  const lastWeekStart = new Date(weekStart.getTime() - 7 * 86_400_000);
  const prevMonthStart = new Date(monthStart);
  prevMonthStart.setUTCMonth(prevMonthStart.getUTCMonth() - 1);

  const chartStart = new Date(todayStart.getTime() - 13 * 86_400_000);
  const sixMonthsStart = new Date(monthStart);
  sixMonthsStart.setUTCMonth(sixMonthsStart.getUTCMonth() - 5);

  const [
    dailyAgg,
    weeklyAgg,
    monthlyAgg,
    allTimeAgg,
    yesterdayAgg,
    lastWeekAgg,
    prevMonthAgg,
    chartPayments,
    monthPayments,
  ] = await Promise.all([
    sumWhere(prisma, { createdAt: { gte: todayStart } }),
    sumWhere(prisma, { createdAt: { gte: weekStart } }),
    sumWhere(prisma, { createdAt: { gte: monthStart } }),
    sumWhere(prisma, {}),
    sumWhere(prisma, {
      createdAt: { gte: yesterdayStart, lt: todayStart },
    }),
    sumWhere(prisma, {
      createdAt: { gte: lastWeekStart, lt: weekStart },
    }),
    sumWhere(prisma, {
      createdAt: { gte: prevMonthStart, lt: monthStart },
    }),
    prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: chartStart },
      },
      select: { amount: true, createdAt: true },
    }),
    prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: sixMonthsStart },
      },
      select: { amount: true, createdAt: true },
    }),
  ]);

  const daily = dailyAgg._sum.amount ?? 0;
  const weekly = weeklyAgg._sum.amount ?? 0;
  const monthly = monthlyAgg._sum.amount ?? 0;
  const allTime = allTimeAgg._sum.amount ?? 0;
  const yesterdayTotal = yesterdayAgg._sum.amount ?? 0;
  const lastWeekTotal = lastWeekAgg._sum.amount ?? 0;
  const prevMonthTotal = prevMonthAgg._sum.amount ?? 0;

  const last14Days: AdminRevenueSummary["last14Days"] = [];
  for (let i = 13; i >= 0; i--) {
    const dayStart = new Date(todayStart.getTime() - i * 86_400_000);
    const key = kenyaDateKey(dayStart);
    last14Days.push({
      dateKey: key,
      label: dayStart.toLocaleDateString("en-KE", {
        timeZone: KENYA_TZ,
        month: "short",
        day: "numeric",
      }),
      amount: 0,
    });
  }

  const dayIndex = new Map(last14Days.map((d, i) => [d.dateKey, i]));
  for (const p of chartPayments) {
    const key = kenyaDateKey(p.createdAt);
    const idx = dayIndex.get(key);
    if (idx !== undefined) {
      last14Days[idx].amount += p.amount;
    }
  }

  const monthBuckets = new Map<string, number>();
  const [curYear, curMonth] = kenyaDateKey(now).split("-").map(Number);
  for (let i = 5; i >= 0; i--) {
    let m = curMonth - i;
    let y = curYear;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    const key = `${y}-${String(m).padStart(2, "0")}`;
    monthBuckets.set(key, 0);
  }

  for (const p of monthPayments) {
    const key = p.createdAt.toLocaleDateString("en-CA", {
      timeZone: KENYA_TZ,
    }).slice(0, 7);
    if (monthBuckets.has(key)) {
      monthBuckets.set(key, (monthBuckets.get(key) ?? 0) + p.amount);
    }
  }

  const last6Months = [...monthBuckets.entries()].map(([key, amount]) => {
    const [y, m] = key.split("-").map(Number);
    const label = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-KE", {
      month: "short",
      year: "numeric",
    });
    return { label, amount };
  });

  return {
    daily,
    weekly,
    monthly,
    allTime,
    dailyPayments: dailyAgg._count._all,
    weeklyPayments: weeklyAgg._count._all,
    monthlyPayments: monthlyAgg._count._all,
    dailyVsYesterday:
      yesterdayTotal > 0
        ? Math.round(((daily - yesterdayTotal) / yesterdayTotal) * 100)
        : daily > 0
          ? 100
          : null,
    weeklyVsLastWeek:
      lastWeekTotal > 0
        ? Math.round(((weekly - lastWeekTotal) / lastWeekTotal) * 100)
        : weekly > 0
          ? 100
          : null,
    monthlyVsLastMonth:
      prevMonthTotal > 0
        ? Math.round(((monthly - prevMonthTotal) / prevMonthTotal) * 100)
        : monthly > 0
          ? 100
          : null,
    last14Days,
    last6Months,
  };
}
