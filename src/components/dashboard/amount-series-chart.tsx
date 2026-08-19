"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

export interface AmountSeriesPoint {
  label: string;
  value: number;
}

interface AmountSeriesChartProps {
  title: string;
  subtitle?: string;
  data: AmountSeriesPoint[];
  height?: number;
  className?: string;
}

export function AmountSeriesChart({
  title,
  subtitle,
  data,
  height = 220,
  className,
}: AmountSeriesChartProps) {
  const safeData = data.length ? data : [{ label: "—", value: 0 }];
  const maxValue = Math.max(...safeData.map((d) => d.value), 1);
  const total = safeData.reduce((s, d) => s + d.value, 0);

  const points = useMemo(() => {
    const w = 100;
    const h = 100;
    return safeData.map((d, i) => {
      const x = safeData.length === 1 ? 50 : (i / (safeData.length - 1)) * w;
      const y = h - (d.value / maxValue) * (h * 0.85) - 5;
      return { x, y, value: d.value, label: d.label };
    });
  }, [safeData, maxValue]);

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaPath = `${linePath} L 100 100 L 0 100 Z`;

  return (
    <div className={cn("rounded-2xl border bg-card p-4 sm:p-5", className)}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {subtitle ? (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">
            {total.toLocaleString("en-KE")}
          </p>
          <p className="text-xs text-muted-foreground">KES paid</p>
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
          <path d={areaPath} className="fill-primary/15" />
          <path
            d={linePath}
            fill="none"
            className="stroke-primary"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {points.map((p, i) => (
            <circle
              key={`${p.label}-${i}`}
              cx={p.x}
              cy={p.y}
              r="1.6"
              className="fill-primary"
            />
          ))}
        </svg>
      </div>

      <div
        className="mt-3 grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${safeData.length}, minmax(0, 1fr))`,
        }}
      >
        {safeData.map((d, i) => (
          <div key={`${d.label}-${i}`} className="text-center">
            <div
              className="mx-auto w-full max-w-[28px] rounded-t-md bg-primary/80"
              style={{
                height: `${Math.max(8, (d.value / maxValue) * 64)}px`,
              }}
              title={`${d.value} KES`}
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              {d.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

