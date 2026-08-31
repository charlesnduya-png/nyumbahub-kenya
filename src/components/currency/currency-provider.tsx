"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  convertCurrency,
  DEFAULT_DISPLAY_CURRENCY,
  formatConvertedPrice,
  readStoredCurrency,
  storeCurrency,
  type SupportedCurrency,
} from "@/lib/currency";

type CurrencyContextValue = {
  currency: SupportedCurrency;
  setCurrency: (code: SupportedCurrency) => void;
  convert: (amount: number, fromCurrency: string) => number;
  formatConvertedPrice: (
    amount: number,
    fromCurrency: string,
    options?: { compact?: boolean },
  ) => string;
  isActive: boolean;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<SupportedCurrency>(
    DEFAULT_DISPLAY_CURRENCY,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredCurrency();
    if (stored) setCurrencyState(stored);
    setReady(true);
  }, []);

  const setCurrency = useCallback((code: SupportedCurrency) => {
    setCurrencyState(code);
    storeCurrency(code);
  }, []);

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      convert: (amount, fromCurrency) => convertCurrency(amount, fromCurrency, currency),
      formatConvertedPrice: (amount, fromCurrency, options) =>
        formatConvertedPrice(amount, fromCurrency, currency, options),
      isActive: ready,
    }),
    [currency, ready, setCurrency],
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useDisplayCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    return {
      currency: DEFAULT_DISPLAY_CURRENCY,
      setCurrency: () => {},
      convert: (amount: number) => amount,
      formatConvertedPrice: (amount: number, fromCurrency: string) =>
        formatConvertedPrice(amount, fromCurrency, DEFAULT_DISPLAY_CURRENCY),
      isActive: false,
    };
  }
  return ctx;
}
