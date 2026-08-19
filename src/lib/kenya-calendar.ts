/** Calendar year/month in East Africa Time (Kenya). */
export function kenyaYearMonth(date = new Date()): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-KE", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "numeric",
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);

  return {
    year: Number.isFinite(year) ? year : date.getFullYear(),
    month: Number.isFinite(month) && month >= 1 && month <= 12 ? month : date.getMonth() + 1,
  };
}

export function kenyaMonthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString("en-KE", {
    month: "long",
    year: "numeric",
  });
}

export function shiftKenyaMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const next = new Date(year, month - 1 + delta, 1);
  return { year: next.getFullYear(), month: next.getMonth() + 1 };
}
