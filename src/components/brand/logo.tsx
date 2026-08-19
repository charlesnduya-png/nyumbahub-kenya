import Link from "next/link";

import { cn } from "@/lib/utils";

interface BrandLogoProps {
  /** Pass null to render without a link (e.g. inside another heading) */
  href?: string | null;
  className?: string;
  /** Show wordmark next to the mark */
  showWordmark?: boolean;
  /** Append "Kenya" under or beside the wordmark */
  showKenya?: boolean;
  /** Mark size */
  size?: "sm" | "md" | "lg";
  /** Use on dark / primary backgrounds */
  onDark?: boolean;
}

const sizeMap = {
  sm: { mark: "h-8 w-8", icon: 18, word: "text-base", kenya: "text-[10px]" },
  md: { mark: "h-9 w-9", icon: 20, word: "text-lg", kenya: "text-[10px]" },
  lg: { mark: "h-11 w-11", icon: 24, word: "text-xl", kenya: "text-xs" },
} as const;

function LogoMark({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("animate-logo-house", className)}
      aria-hidden="true"
    >
      {/* Roof */}
      <path
        d="M4 15.5L16 5l12 10.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* House body */}
      <path
        d="M7.5 14.5V25.5a1.5 1.5 0 0 0 1.5 1.5h14a1.5 1.5 0 0 0 1.5-1.5v-11"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Door */}
      <path
        d="M13.5 27V20.5a2.5 2.5 0 0 1 5 0V27"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Hub nodes — connection points */}
      <circle
        className="logo-hub-core"
        cx="16"
        cy="11.5"
        r="2.1"
        fill="currentColor"
      />
      <circle
        className="logo-hub-node logo-hub-node-left"
        cx="9.5"
        cy="17.5"
        r="1.35"
        fill="currentColor"
        opacity="0.85"
      />
      <circle
        className="logo-hub-node logo-hub-node-right"
        cx="22.5"
        cy="17.5"
        r="1.35"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        className="logo-hub-spokes"
        d="M16 13.5v2.2M14.2 16.2l-3.2 1M17.8 16.2l3.2 1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

export function BrandLogo({
  href = "/",
  className,
  showWordmark = true,
  showKenya = false,
  size = "md",
  onDark = false,
}: BrandLogoProps) {
  const s = sizeMap[size];

  const content = (
    <>
      <span
        className={cn(
          "animate-logo-mark inline-flex shrink-0 items-center justify-center rounded-xl",
          s.mark,
          onDark
            ? "bg-white/15 text-white ring-1 ring-white/25"
            : "bg-primary text-primary-foreground",
        )}
      >
        <LogoMark size={s.icon} />
      </span>
      {showWordmark ? (
        <span className="flex min-w-0 flex-col leading-none">
          <span
            className={cn(
              "font-display font-semibold tracking-tight",
              s.word,
              onDark ? "text-white" : "text-foreground",
            )}
          >
            Your{" "}
            <span className={onDark ? "text-emerald-200" : "text-primary"}>
              Home
            </span>
          </span>
          {showKenya ? (
            <span
              className={cn(
                "mt-0.5 font-sans font-medium uppercase tracking-[0.18em]",
                s.kenya,
                onDark ? "text-white/70" : "text-muted-foreground",
              )}
            >
              Kenya
            </span>
          ) : null}
        </span>
      ) : null}
    </>
  );

  const classes = cn(
    "group inline-flex items-center gap-2.5 rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-label="Your Home — home">
        {content}
      </Link>
    );
  }

  return (
    <span className={classes} aria-label="Your Home">
      {content}
    </span>
  );
}

export { LogoMark };
