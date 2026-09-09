import type { PrismaClient } from "@prisma/client";
import { getKenyaPeriodStarts, kenyaDateKey } from "@/lib/admin-revenue";
import type {
  TrafficRange,
  TrafficReport,
  TrafficSeriesPoint,
} from "@/lib/live-analytics";
import { comparePeriodChange } from "@/lib/live-analytics";
import {
  siteVisitRetentionStart,
} from "@/lib/site-visit-retention";
import { ttlCached } from "@/lib/ttl-cache";

export type { TrafficRange, TrafficReport } from "@/lib/live-analytics";

const KENYA_TZ = "Africa/Nairobi";
const LIVE_WINDOW_MS = 5 * 60 * 1000;

type BucketRow = {
  bucket: string;
  page_views: number;
  visitors: number;
};

function kenyaMidnight(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00+03:00`);
}

export function getKenyaYearStart(now = new Date()): Date {
  const year = kenyaDateKey(now).split("-")[0];
  return kenyaMidnight(`${year}-01-01`);
}

function formatHour(h: number) {
  return `${h === 0 ? 12 : h > 12 ? h - 12 : h}${h < 12 ? "am" : "pm"}`;
}

function shiftMonthKey(year: number, month: number, delta: number) {
  let m = month + delta;
  let y = year;
  while (m <= 0) {
    m += 12;
    y -= 1;
  }
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  return kenyaMidnight(`${y}-${String(m).padStart(2, "0")}-01`);
}

async function countPeriod(
  prisma: PrismaClient,
  since: Date,
  until?: Date,
): Promise<{ visitors: number; pageViews: number }> {
  const pageViews = await prisma.siteVisit.count({
    where: {
      createdAt: until ? { gte: since, lt: until } : { gte: since },
    },
  });

  const visitorRows = until
    ? await prisma.$queryRaw<[{ count: number }]>`
        SELECT COUNT(DISTINCT "sessionId")::int AS count
        FROM "SiteVisit"
        WHERE "createdAt" >= ${since} AND "createdAt" < ${until}
      `
    : await prisma.$queryRaw<[{ count: number }]>`
        SELECT COUNT(DISTINCT "sessionId")::int AS count
        FROM "SiteVisit"
        WHERE "createdAt" >= ${since}
      `;

  return { visitors: visitorRows[0]?.count ?? 0, pageViews };
}

async function dailyBuckets(
  prisma: PrismaClient,
  since: Date,
  until: Date,
): Promise<BucketRow[]> {
  return prisma.$queryRaw<BucketRow[]>`
    SELECT
      to_char("createdAt" AT TIME ZONE 'Africa/Nairobi', 'YYYY-MM-DD') AS bucket,
      COUNT(*)::int AS page_views,
      COUNT(DISTINCT "sessionId")::int AS visitors
    FROM "SiteVisit"
    WHERE "createdAt" >= ${since} AND "createdAt" < ${until}
    GROUP BY bucket
    ORDER BY bucket
  `;
}

async function monthlyBuckets(
  prisma: PrismaClient,
  since: Date,
  until: Date,
): Promise<BucketRow[]> {
  return prisma.$queryRaw<BucketRow[]>`
    SELECT
      to_char("createdAt" AT TIME ZONE 'Africa/Nairobi', 'YYYY-MM') AS bucket,
      COUNT(*)::int AS page_views,
      COUNT(DISTINCT "sessionId")::int AS visitors
    FROM "SiteVisit"
    WHERE "createdAt" >= ${since} AND "createdAt" < ${until}
    GROUP BY bucket
    ORDER BY bucket
  `;
}

function fillDailySeriesFromStart(
  start: Date,
  end: Date,
  rows: BucketRow[],
): TrafficSeriesPoint[] {
  const map = new Map(rows.map((r) => [r.bucket, r]));
  const series: TrafficSeriesPoint[] = [];
  const cursor = new Date(start);
  while (cursor < end) {
    const key = kenyaDateKey(cursor);
    const row = map.get(key);
    series.push({
      key,
      label: cursor.toLocaleDateString("en-KE", {
        timeZone: KENYA_TZ,
        month: "short",
        day: "numeric",
      }),
      visitors: row?.visitors ?? 0,
      pageViews: row?.page_views ?? 0,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return series;
}

function fillMonthlySeries(
  year: number,
  monthCount: number,
  rows: BucketRow[],
): TrafficSeriesPoint[] {
  const map = new Map(rows.map((r) => [r.bucket, r]));
  const series: TrafficSeriesPoint[] = [];
  for (let m = 1; m <= monthCount; m++) {
    const key = `${year}-${String(m).padStart(2, "0")}`;
    const row = map.get(key);
    const label = new Date(Date.UTC(year, m - 1, 1)).toLocaleDateString(
      "en-KE",
      { month: "short", year: "numeric" },
    );
    series.push({
      key,
      label,
      visitors: row?.visitors ?? 0,
      pageViews: row?.page_views ?? 0,
    });
  }
  return series;
}

async function topPagesInPeriod(
  prisma: PrismaClient,
  since: Date,
  until?: Date,
  limit = 10,
) {
  const rows = until
    ? await prisma.$queryRaw<
        Array<{ path: string; page_views: number; visitors: number }>
      >`
        SELECT
          path,
          COUNT(*)::int AS page_views,
          COUNT(DISTINCT "sessionId")::int AS visitors
        FROM "SiteVisit"
        WHERE "createdAt" >= ${since} AND "createdAt" < ${until}
        GROUP BY path
        ORDER BY page_views DESC
        LIMIT ${limit}
      `
    : await prisma.$queryRaw<
        Array<{ path: string; page_views: number; visitors: number }>
      >`
        SELECT
          path,
          COUNT(*)::int AS page_views,
          COUNT(DISTINCT "sessionId")::int AS visitors
        FROM "SiteVisit"
        WHERE "createdAt" >= ${since}
        GROUP BY path
        ORDER BY page_views DESC
        LIMIT ${limit}
      `;

  return rows.map((r) => ({
    path: r.path,
    views: r.page_views,
    visitors: r.visitors,
  }));
}

async function recentActivity(prisma: PrismaClient, now: Date) {
  const visits = await prisma.siteVisit.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
    select: { sessionId: true, path: true, createdAt: true },
  });
  return visits.map((v) => ({
    path: v.path,
    sessionLabel: `Visitor …${v.sessionId.slice(-4)}`,
    secondsAgo: Math.max(
      0,
      Math.floor((now.getTime() - v.createdAt.getTime()) / 1000),
    ),
  }));
}

async function hourlyVisitorBuckets(
  prisma: PrismaClient,
  since: Date,
  until: Date,
): Promise<Array<{ hour: number; visitors: number }>> {
  const rows = await prisma.$queryRaw<Array<{ hour: number; visitors: number }>>`
    SELECT
      EXTRACT(HOUR FROM ("createdAt" AT TIME ZONE 'Africa/Nairobi'))::int AS hour,
      COUNT(DISTINCT "sessionId")::int AS visitors
    FROM "SiteVisit"
    WHERE "createdAt" >= ${since} AND "createdAt" < ${until}
    GROUP BY hour
  `;
  return rows;
}

async function liveVisitorCount(prisma: PrismaClient, since: Date) {
  const rows = await prisma.$queryRaw<[{ count: number }]>`
    SELECT COUNT(DISTINCT "sessionId")::int AS count
    FROM "SiteVisit"
    WHERE "createdAt" >= ${since}
  `;
  return rows[0]?.count ?? 0;
}

/** Bounded "all time" = retention window only (never scan from epoch). */
async function retentionTotals(prisma: PrismaClient, now: Date) {
  return countPeriod(prisma, siteVisitRetentionStart(now));
}

async function getLiveReport(
  prisma: PrismaClient,
  now: Date,
): Promise<TrafficReport> {
  const { todayStart } = getKenyaPeriodStarts(now);
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
  const liveSince = new Date(now.getTime() - LIVE_WINDOW_MS);
  const yesterdaySameTimeEnd = new Date(now.getTime() - 86_400_000);
  const tomorrow = new Date(todayStart.getTime() + 86_400_000);

  const [
    liveNow,
    retention,
    todayStats,
    yesterdaySameStats,
    todayRows,
    hourlyTodayRows,
    hourlyYesterdayRows,
    topPages,
    activity,
  ] = await Promise.all([
    liveVisitorCount(prisma, liveSince),
    retentionTotals(prisma, now),
    countPeriod(prisma, todayStart),
    countPeriod(prisma, yesterdayStart, yesterdaySameTimeEnd),
    dailyBuckets(prisma, todayStart, tomorrow),
    hourlyVisitorBuckets(prisma, todayStart, tomorrow),
    hourlyVisitorBuckets(prisma, yesterdayStart, todayStart),
    topPagesInPeriod(prisma, todayStart),
    recentActivity(prisma, now),
  ]);

  const hourlyTodayMap = new Map<number, number>();
  const hourlyYesterdayMap = new Map<number, number>();
  for (let h = 0; h < 24; h++) {
    hourlyTodayMap.set(h, 0);
    hourlyYesterdayMap.set(h, 0);
  }
  for (const row of hourlyTodayRows) {
    hourlyTodayMap.set(row.hour, row.visitors);
  }
  for (const row of hourlyYesterdayRows) {
    hourlyYesterdayMap.set(row.hour, row.visitors);
  }

  return {
    range: "live",
    rangeLabel: "Today",
    compareLabel: "Yesterday (same time)",
    liveNow,
    visitors: todayStats.visitors,
    pageViews: todayStats.pageViews,
    previousVisitors: yesterdaySameStats.visitors,
    previousPageViews: yesterdaySameStats.pageViews,
    changePercent: comparePeriodChange(
      todayStats.visitors,
      yesterdaySameStats.visitors,
    ),
    series: fillDailySeriesFromStart(todayStart, tomorrow, todayRows),
    previousSeries: [],
    topPages,
    recentActivity: activity,
    hourlyToday: [...hourlyTodayMap.entries()].map(([hour, visitors]) => ({
      hour,
      label: formatHour(hour),
      visitors,
    })),
    hourlyYesterday: [...hourlyYesterdayMap.entries()].map(
      ([hour, visitors]) => ({
        hour,
        label: formatHour(hour),
        visitors,
      }),
    ),
    allTime: retention,
    updatedAt: now.toISOString(),
  };
}

async function getWeekReport(
  prisma: PrismaClient,
  now: Date,
): Promise<TrafficReport> {
  const { weekStart } = getKenyaPeriodStarts(now);
  const nextWeekStart = new Date(weekStart.getTime() + 7 * 86_400_000);
  const prevWeekStart = new Date(weekStart.getTime() - 7 * 86_400_000);

  const [current, previous, retention, currentRows, previousRows, topPages, activity] =
    await Promise.all([
      countPeriod(prisma, weekStart),
      countPeriod(prisma, prevWeekStart, weekStart),
      retentionTotals(prisma, now),
      dailyBuckets(prisma, weekStart, nextWeekStart),
      dailyBuckets(prisma, prevWeekStart, weekStart),
      topPagesInPeriod(prisma, weekStart),
      recentActivity(prisma, now),
    ]);

  return {
    range: "week",
    rangeLabel: "This week",
    compareLabel: "Last week",
    visitors: current.visitors,
    pageViews: current.pageViews,
    previousVisitors: previous.visitors,
    previousPageViews: previous.pageViews,
    changePercent: comparePeriodChange(current.visitors, previous.visitors),
    series: fillDailySeriesFromStart(weekStart, nextWeekStart, currentRows),
    previousSeries: fillDailySeriesFromStart(
      prevWeekStart,
      weekStart,
      previousRows,
    ),
    topPages,
    recentActivity: activity,
    allTime: retention,
    updatedAt: now.toISOString(),
  };
}

async function getMonthReport(
  prisma: PrismaClient,
  now: Date,
): Promise<TrafficReport> {
  const { monthStart, todayStart } = getKenyaPeriodStarts(now);
  const dateKey = kenyaDateKey(now);
  const [y, m] = dateKey.split("-").map(Number);
  const prevMonthStart = shiftMonthKey(y, m, -1);
  const tomorrow = new Date(todayStart.getTime() + 86_400_000);

  const [current, previous, retention, currentRows, previousRows, topPages, activity] =
    await Promise.all([
      countPeriod(prisma, monthStart),
      countPeriod(prisma, prevMonthStart, monthStart),
      retentionTotals(prisma, now),
      dailyBuckets(prisma, monthStart, tomorrow),
      dailyBuckets(prisma, prevMonthStart, monthStart),
      topPagesInPeriod(prisma, monthStart),
      recentActivity(prisma, now),
    ]);

  return {
    range: "month",
    rangeLabel: new Date(monthStart).toLocaleDateString("en-KE", {
      timeZone: KENYA_TZ,
      month: "long",
      year: "numeric",
    }),
    compareLabel: "Last month",
    visitors: current.visitors,
    pageViews: current.pageViews,
    previousVisitors: previous.visitors,
    previousPageViews: previous.pageViews,
    changePercent: comparePeriodChange(current.visitors, previous.visitors),
    series: fillDailySeriesFromStart(monthStart, tomorrow, currentRows),
    previousSeries: fillDailySeriesFromStart(
      prevMonthStart,
      monthStart,
      previousRows,
    ),
    topPages,
    recentActivity: activity,
    allTime: retention,
    updatedAt: now.toISOString(),
  };
}

async function getYearReport(
  prisma: PrismaClient,
  now: Date,
): Promise<TrafficReport> {
  const yearStart = getKenyaYearStart(now);
  const year = Number(kenyaDateKey(now).split("-")[0]);
  const prevYearStart = kenyaMidnight(`${year - 1}-01-01`);
  const tomorrow = new Date(
    getKenyaPeriodStarts(now).todayStart.getTime() + 86_400_000,
  );
  const currentMonth = Number(kenyaDateKey(now).split("-")[1]);
  // Bound year scans to retention window so we never full-table scan.
  const since = new Date(
    Math.max(yearStart.getTime(), siteVisitRetentionStart(now).getTime()),
  );
  const prevSince = new Date(
    Math.max(prevYearStart.getTime(), siteVisitRetentionStart(now).getTime()),
  );

  const [
    current,
    previous,
    retention,
    currentRows,
    previousRows,
    topPages,
    activity,
  ] = await Promise.all([
    countPeriod(prisma, since),
    countPeriod(prisma, prevSince, yearStart),
    retentionTotals(prisma, now),
    monthlyBuckets(prisma, since, tomorrow),
    monthlyBuckets(prisma, prevSince, yearStart),
    topPagesInPeriod(prisma, since),
    recentActivity(prisma, now),
  ]);

  return {
    range: "year",
    rangeLabel: String(year),
    compareLabel: String(year - 1),
    visitors: current.visitors,
    pageViews: current.pageViews,
    previousVisitors: previous.visitors,
    previousPageViews: previous.pageViews,
    changePercent: comparePeriodChange(current.visitors, previous.visitors),
    series: fillMonthlySeries(year, currentMonth, currentRows),
    previousSeries: fillMonthlySeries(year - 1, 12, previousRows),
    topPages,
    recentActivity: activity,
    allTime: retention,
    updatedAt: now.toISOString(),
  };
}

export function parseTrafficRange(value: string | null): TrafficRange {
  if (value === "week" || value === "month" || value === "year") return value;
  return "live";
}

export async function getTrafficAnalytics(
  prisma: PrismaClient,
  range: TrafficRange = "live",
): Promise<TrafficReport> {
  const ttlMs =
    range === "live" ? 90_000 : range === "week" ? 180_000 : 300_000;

  return ttlCached(`traffic:${range}`, ttlMs, async () => {
    const now = new Date();
    switch (range) {
      case "week":
        return getWeekReport(prisma, now);
      case "month":
        return getMonthReport(prisma, now);
      case "year":
        return getYearReport(prisma, now);
      case "live":
      default:
        return getLiveReport(prisma, now);
    }
  });
}

export async function getLiveAnalytics(prisma: PrismaClient) {
  const report = await getLiveReport(prisma, new Date());
  return {
    liveNow: report.liveNow ?? 0,
    todayVisitors: report.visitors,
    yesterdayVisitors: report.previousVisitors,
    yesterdaySameTimeVisitors: report.previousVisitors,
    todayPageViews: report.pageViews,
    yesterdayPageViews: report.previousPageViews,
    yesterdaySameTimePageViews: report.previousPageViews,
    hourlyToday: report.hourlyToday ?? [],
    hourlyYesterday: report.hourlyYesterday ?? [],
    topPagesToday: report.topPages,
    recentActivity: report.recentActivity,
    updatedAt: report.updatedAt,
  };
}
