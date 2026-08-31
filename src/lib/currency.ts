import { formatPrice } from "@/lib/utils";

/** How many Kenyan shillings equal one unit of each currency (approximate mid-market). */
export const KES_PER_CURRENCY_UNIT = {
  KES: 1,
  USD: 129,
  EUR: 140,
  GBP: 163,
  NGN: 0.086,
  GHS: 8.6,
  ZAR: 7.17,
  UGX: 0.035,
  TZS: 0.05,
  RWF: 0.095,
  EGP: 2.6,
  MAD: 12.8,
} as const;

export type SupportedCurrency = keyof typeof KES_PER_CURRENCY_UNIT;

export const SUPPORTED_CURRENCIES: Array<{
  code: SupportedCurrency;
  label: string;
  symbol: string;
}> = [
  { code: "KES", label: "Kenyan Shilling", symbol: "KSh" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "NGN", label: "Nigerian Naira", symbol: "₦" },
  { code: "GHS", label: "Ghanaian Cedi", symbol: "GH₵" },
  { code: "ZAR", label: "South African Rand", symbol: "R" },
  { code: "UGX", label: "Ugandan Shilling", symbol: "USh" },
  { code: "TZS", label: "Tanzanian Shilling", symbol: "TSh" },
  { code: "RWF", label: "Rwandan Franc", symbol: "FRw" },
  { code: "EGP", label: "Egyptian Pound", symbol: "E£" },
  { code: "MAD", label: "Moroccan Dirham", symbol: "MAD" },
];

export const DEFAULT_DISPLAY_CURRENCY: SupportedCurrency = "KES";

const STORAGE_KEY = "your-home-display-currency";

export function normalizeCurrencyCode(code: string | null | undefined): SupportedCurrency {
  const upper = (code ?? "").trim().toUpperCase();
  if (upper in KES_PER_CURRENCY_UNIT) {
    return upper as SupportedCurrency;
  }
  return DEFAULT_DISPLAY_CURRENCY;
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: SupportedCurrency,
): number {
  if (!Number.isFinite(amount)) return 0;

  const from = normalizeCurrencyCode(fromCurrency);
  const to = normalizeCurrencyCode(toCurrency);
  if (from === to) return amount;

  const fromRate = KES_PER_CURRENCY_UNIT[from];
  const toRate = KES_PER_CURRENCY_UNIT[to];
  const amountInKes = amount * fromRate;
  const converted = amountInKes / toRate;

  if (converted >= 1_000_000) return Math.round(converted / 1000) * 1000;
  if (converted >= 10_000) return Math.round(converted / 100) * 100;
  if (converted >= 1_000) return Math.round(converted / 10) * 10;
  return Math.round(converted);
}

export function formatConvertedPrice(
  amount: number,
  fromCurrency: string,
  displayCurrency: SupportedCurrency,
  options?: { compact?: boolean },
): string {
  const converted = convertCurrency(amount, fromCurrency, displayCurrency);
  return formatPrice(converted, {
    currency: displayCurrency,
    compact: options?.compact,
  });
}

export function readStoredCurrency(): SupportedCurrency | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeCurrencyCode(raw) : null;
  } catch {
    return null;
  }
}

export function storeCurrency(code: SupportedCurrency) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // ignore quota / private mode
  }
}

export function currencyLabel(code: SupportedCurrency) {
  return SUPPORTED_CURRENCIES.find((row) => row.code === code)?.label ?? code;
}
