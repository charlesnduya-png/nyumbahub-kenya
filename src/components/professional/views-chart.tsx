"use client";

import { useMemo } from "react";
import type { ViewsPoint } from "@/data/analytics";
import { cn } from "@/lib/utils";

interface ViewsChartProps {
  data: ViewsPoint[];
  title?: string;
  className?: string;
  height?: number;
}

export function ViewsChart({
  data,
  title = "Listing views (7 days)",
  className,
  height = 220,
}: ViewsChartProps) {
  const maxViews = Math.max(...data.map((d) => d.views), 1);
  const totalViews = data.reduce((s, d) => s + d.views, 0);
  const totalInquiries = data.reduce((s, d) => s + d.inquiries, 0);

  const points = useMemo(() => {
    const w = 100;
    const h = 100;
    return data.map((d, i) => {
      const x = data.length === 1 ? 50 : (i / (data.length - 1)) * w;
      const y = h - (d.views / maxViews) * (h * 0.85) - 5;
      return { x, y, ...d };
    });
  }, [data, maxViews]);

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaPath = `${linePath} L 100 100 L 0 100 Z`;

  return (
    <div className={cn("rounded-2xl border bg-card p-4 sm:p-5", className)}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">
            How many people viewed your listings this week
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">
            {totalViews.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            views · {totalInquiries} inquiries
          </p>
        </div>
      </div>

      <div className="relative" style={{ height }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="h-full w-full overflow-visible"
          role="img"
          aria-label={title}
        >
          {[0.25, 0.5, 0.75, 1].map((g) => (
            <line
              key={g}
              x1="0"
              x2="100"
              y1={100 - g * 85 - 5}
              y2={100 - g * 85 - 5}
              stroke="currentColor"
              className="text-border"
              strokeWidth="0.3"
            />
          ))}
          <path
            d={areaPath}
            className="fill-primary/15"
          />
          <path
            d={linePath}
            fill="none"
            className="stroke-primary"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {points.map((p) => (
            <circle
              key={p.label}
              cx={p.x}
              cy={p.y}
              r="1.6"
              className="fill-primary"
            />
          ))}
        </svg>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1">
        {data.map((d) => (
          <div key={d.label} className="text-center">
            <div
              className="mx-auto w-full max-w-[28px] rounded-t-md bg-primary/80"
              style={{
                height: `${Math.max(8, (d.views / maxViews) * 64)}px`,
              }}
              title={`${d.views} views`}
            />
            <p className="mt-1 text-[10px] text-muted-foreground">{d.label}</p>
            <p className="text-[10px] font-medium">{d.views}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
