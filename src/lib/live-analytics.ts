export type TrafficRange = "live" | "week" | "month" | "year";

export type TrafficSeriesPoint = {
  label: string;
  key: string;
  visitors: number;
  pageViews: number;
};

export type TrafficReport = {
  range: TrafficRange;
  rangeLabel: string;
  compareLabel: string;
  liveNow?: number;
  visitors: number;
  pageViews: number;
  previousVisitors: number;
  previousPageViews: number;
  changePercent: number | null;
  series: TrafficSeriesPoint[];
  previousSeries: TrafficSeriesPoint[];
  topPages: Array<{ path: string; views: number; visitors: number }>;
  recentActivity: Array<{
    path: string;
    sessionLabel: string;
    secondsAgo: number;
  }>;
  hourlyToday?: Array<{ hour: number; label: string; visitors: number }>;
  hourlyYesterday?: Array<{ hour: number; label: string; visitors: number }>;
  allTime: { visitors: number; pageViews: number };
  updatedAt: string;
};

/** @deprecated Use TrafficReport */
export type LiveAnalytics = {
  liveNow: number;
  todayVisitors: number;
  yesterdayVisitors: number;
  yesterdaySameTimeVisitors: number;
  todayPageViews: number;
  yesterdayPageViews: number;
  yesterdaySameTimePageViews: number;
  hourlyToday: Array<{ hour: number; label: string; visitors: number }>;
  hourlyYesterday: Array<{ hour: number; label: string; visitors: number }>;
  topPagesToday: Array<{ path: string; views: number; visitors: number }>;
  recentActivity: Array<{
    path: string;
    sessionLabel: string;
    secondsAgo: number;
  }>;
  updatedAt: string;
};

export function comparePeriodChange(
  current: number,
  previous: number,
): number | null {
  if (previous <= 0) {
    return current > 0 ? 100 : null;
  }
  return Math.round(((current - previous) / previous) * 100);
}

export function compareVsYesterday(
  today: number,
  yesterdaySameTime: number,
): number | null {
  return comparePeriodChange(today, yesterdaySameTime);
}

export const TRAFFIC_RANGE_LABELS: Record<
  TrafficRange,
  { title: string; description: string }
> = {
  live: {
    title: "Live",
    description: "Real-time visitors today vs yesterday",
  },
  week: {
    title: "Week",
    description: "This week vs last week (Mon–Sun, Kenya time)",
  },
  month: {
    title: "Month",
    description: "This calendar month vs last month",
  },
  year: {
    title: "Year",
    description: "This calendar year vs last year",
  },
};
