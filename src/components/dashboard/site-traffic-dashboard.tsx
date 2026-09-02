"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  BarChart3,
  Eye,
  Globe,
  Loader2,
  Radio,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  TRAFFIC_RANGE_LABELS,
  type TrafficRange,
  type TrafficReport,
} from "@/lib/live-analytics";

const RANGES: TrafficRange[] = ["live", "week", "month", "year"];

function formatRelative(seconds: number) {
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

function ChangePill({
  value,
  compareLabel,
}: {
  value: number | null;
  compareLabel: string;
}) {
  if (value === null) {
    return (
      <span className="text-xs text-muted-foreground">
        No prior {compareLabel.toLowerCase()} data
      </span>
    );
  }
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        up
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "bg-red-500/10 text-red-700 dark:text-red-300",
      )}
    >
      <Icon className="h-3 w-3" />
      {up ? "+" : ""}
      {value}% vs {compareLabel.toLowerCase()}
    </span>
  );
}

function SeriesChart({
  title,
  current,
  previous,
  compareLabel,
  currentHour,
  isLive,
}: {
  title: string;
  current: TrafficReport["series"];
  previous: TrafficReport["previousSeries"];
  compareLabel: string;
  currentHour?: number;
  isLive?: boolean;
}) {
  const max = Math.max(
    ...current.map((d) => d.visitors),
    ...previous.map((d) => d.visitors),
    1,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-4 rounded-sm bg-primary" />
            Current period
          </span>
          {previous.length > 0 ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-4 rounded-sm bg-muted-foreground/40" />
              {compareLabel}
            </span>
          ) : null}
        </div>
        <div className="flex h-44 items-end gap-0.5 overflow-x-auto pb-1">
          {current.map((point, i) => {
            const prev = previous[i]?.visitors ?? 0;
            const isFuture =
              isLive && point.key.includes("-") && i > (currentHour ?? 23);
            return (
              <div
                key={point.key}
                className="flex min-w-[14px] flex-1 flex-col items-center gap-1"
                title={`${point.label}: ${point.visitors} visitors, ${point.pageViews} views`}
              >
                <div className="flex h-36 w-full items-end justify-center gap-0.5">
                  <div
                    className={cn(
                      "w-[42%] rounded-t-sm bg-primary/90",
                      isFuture && "opacity-25",
                    )}
                    style={{
                      height: `${Math.max(4, (point.visitors / max) * 100)}%`,
                    }}
                  />
                  {previous.length > 0 ? (
                    <div
                      className="w-[42%] rounded-t-sm bg-muted-foreground/35"
                      style={{
                        height: `${Math.max(4, (prev / max) * 100)}%`,
                      }}
                    />
                  ) : null}
                </div>
                {(current.length <= 12 && i % 1 === 0) ||
                (current.length > 12 && i % Math.ceil(current.length / 8) === 0) ? (
                  <span className="max-w-[48px] truncate text-[9px] text-muted-foreground">
                    {point.label}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function HourlyCompareChart({
  today,
  yesterday,
  currentHour,
}: {
  today: NonNullable<TrafficReport["hourlyToday"]>;
  yesterday: NonNullable<TrafficReport["hourlyYesterday"]>;
  currentHour: number;
}) {
  const max = Math.max(
    ...today.map((d) => d.visitors),
    ...yesterday.map((d) => d.visitors),
    1,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Visitors by hour — today vs yesterday
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-4 rounded-sm bg-primary" />
            Today
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-4 rounded-sm bg-muted-foreground/40" />
            Yesterday
          </span>
        </div>
        <div className="flex h-40 items-end gap-0.5 overflow-x-auto pb-1">
          {today.map((point, i) => {
            const prev = yesterday[i]?.visitors ?? 0;
            const isFuture = point.hour > currentHour;
            return (
              <div
                key={point.hour}
                className="flex min-w-[18px] flex-1 flex-col items-center gap-1"
              >
                <div className="flex h-32 w-full items-end justify-center gap-0.5">
                  <div
                    className={cn(
                      "w-[42%] rounded-t-sm bg-primary/90",
                      isFuture && "opacity-25",
                    )}
                    style={{
                      height: `${Math.max(4, (point.visitors / max) * 100)}%`,
                    }}
                  />
                  <div
                    className="w-[42%] rounded-t-sm bg-muted-foreground/35"
                    style={{
                      height: `${Math.max(4, (prev / max) * 100)}%`,
                    }}
                  />
                </div>
                {point.hour % 3 === 0 ? (
                  <span className="text-[9px] text-muted-foreground">
                    {point.label}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function SiteTrafficDashboard() {
  const searchParams = useSearchParams();
  const initialRange = (searchParams.get("range") as TrafficRange) || "live";
  const [range, setRange] = useState<TrafficRange>(
    RANGES.includes(initialRange) ? initialRange : "live",
  );
  const [data, setData] = useState<TrafficReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (selected: TrafficRange) => {
    try {
      const res = await fetch(`/api/admin/traffic?range=${selected}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(true);
        return;
      }
      setData(json.data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void load(range);
    const ms = range === "live" ? 60_000 : 120_000;

    function tick() {
      if (document.visibilityState !== "visible") return;
      void load(range);
    }

    const id = window.setInterval(tick, ms);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [range, load]);

  useEffect(() => {
    const param = searchParams.get("range") as TrafficRange;
    if (param && RANGES.includes(param)) setRange(param);
  }, [searchParams]);

  const currentHour = useMemo(
    () =>
      Number(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "Africa/Nairobi",
          hour: "numeric",
          hour12: false,
        }).format(new Date()),
      ),
    [data?.updatedAt],
  );

  if (loading && !data) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading site traffic…
        </CardContent>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          Could not load traffic data.
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const meta = TRAFFIC_RANGE_LABELS[data.range];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Site traffic</h1>
          <p className="text-muted-foreground">
            Track visitors over time — live, weekly, monthly, and yearly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data.range === "live" ? (
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live · updates every 20s
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              Kenya time (EAT) · updates every 60s
            </span>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/admin">Admin home</Link>
          </Button>
        </div>
      </div>

      <Tabs
        value={range}
        onValueChange={(v) => setRange(v as TrafficRange)}
      >
        <TabsList className="flex h-auto flex-wrap gap-1">
          {RANGES.map((r) => (
            <TabsTrigger key={r} value={r} className="gap-2">
              {TRAFFIC_RANGE_LABELS[r].title}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <p className="text-sm text-muted-foreground">{meta.description}</p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.range === "live" ? (
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Radio className="h-4 w-4 text-emerald-500" />
                Right now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold tabular-nums">{data.liveNow ?? 0}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Last 5 minutes
              </p>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Eye className="h-4 w-4" />
              {data.rangeLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">
              {data.visitors.toLocaleString("en-KE")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.pageViews.toLocaleString("en-KE")} page views
            </p>
            <div className="mt-3">
              <ChangePill
                value={data.changePercent}
                compareLabel={data.compareLabel}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Globe className="h-4 w-4" />
              {data.compareLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">
              {data.previousVisitors.toLocaleString("en-KE")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.previousPageViews.toLocaleString("en-KE")} page views
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              All time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">
              {data.allTime.visitors.toLocaleString("en-KE")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.allTime.pageViews.toLocaleString("en-KE")} total page views
            </p>
          </CardContent>
        </Card>
      </div>

      {data.range === "live" &&
      data.hourlyToday &&
      data.hourlyYesterday ? (
        <HourlyCompareChart
          today={data.hourlyToday}
          yesterday={data.hourlyYesterday}
          currentHour={currentHour}
        />
      ) : (
        <SeriesChart
          title={
            data.range === "year"
              ? "Visitors by month"
              : "Visitors by day"
          }
          current={data.series}
          previous={data.previousSeries}
          compareLabel={data.compareLabel}
          currentHour={currentHour}
          isLive={false}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Top pages</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topPages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No page views in this period yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Page</th>
                      <th className="pb-2 pr-4 font-medium">Views</th>
                      <th className="pb-2 font-medium">Visitors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topPages.map((row) => (
                      <tr key={row.path} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-mono text-xs">
                          {row.path}
                        </td>
                        <td className="py-2 pr-4">{row.views}</td>
                        <td className="py-2">{row.visitors}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Recent visits
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-72 space-y-2 overflow-y-auto">
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No visits recorded yet.
              </p>
            ) : (
              data.recentActivity.map((item, i) => (
                <div
                  key={`${item.path}-${item.secondsAgo}-${i}`}
                  className="flex items-start justify-between gap-2 border-b pb-2 text-sm last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.path}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.sessionLabel}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {formatRelative(item.secondsAgo)}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
