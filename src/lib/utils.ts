import { type ClassValue, clsx } from "clsx";
import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a listing price in the chosen currency (KES by default).
 */
export function formatPrice(
  amount: number,
  options?: {
    currency?: string;
    compact?: boolean;
    minimumFractionDigits?: number;
  },
): string {
  const {
    currency = "KES",
    compact = false,
    minimumFractionDigits = 0,
  } = options ?? {};

  if (!Number.isFinite(amount)) {
    return `${currency} —`;
  }

  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      notation: compact ? "compact" : "standard",
      minimumFractionDigits,
      maximumFractionDigits: minimumFractionDigits,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-KE")}`;
  }
}

/**
 * Format a date string or Date object for display.
 */
export function formatDate(
  value: string | Date,
  pattern = "dd MMM yyyy",
): string {
  const date = typeof value === "string" ? parseISO(value) : value;

  if (!isValid(date)) {
    return "—";
  }

  return format(date, pattern);
}

/**
 * Format a date as a relative time string (e.g. "3 days ago").
 */
export function formatRelativeDate(value: string | Date): string {
  const date = typeof value === "string" ? parseISO(value) : value;

  if (!isValid(date)) {
    return "—";
  }

  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Convert a string to a URL-friendly slug.
 */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Truncate text to a maximum length with an optional suffix.
 */
export function truncate(
  text: string,
  maxLength: number,
  suffix = "…",
): string {
  if (text.length <= maxLength) {
    return text;
  }

  const trimmedLength = Math.max(0, maxLength - suffix.length);
  return `${text.slice(0, trimmedLength).trimEnd()}${suffix}`;
}
