/**
 * IntaSend payment collection (M-Pesa STK push).
 *
 * Required env:
 * - INTASEND_SECRET_KEY  (ISSecretKey_live_… — server only, never expose)
 * - INTASEND_PUBLIC_KEY or INTASEND_API_KEY (ISPubKey_live_… publishable key)
 *
 * Optional:
 * - INTASEND_WEBHOOK_CHALLENGE — validate webhook `challenge` field
 */

import { normalizeMpesaPhone } from "@/lib/mpesa";

const INTASEND_API_BASE = "https://api.intasend.com";

export class IntaSendConfigError extends Error {
  constructor(message = "IntaSend is not configured") {
    super(message);
    this.name = "IntaSendConfigError";
  }
}

export class IntaSendApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly responseBody?: unknown,
  ) {
    super(message);
    this.name = "IntaSendApiError";
  }
}

interface IntaSendConfig {
  publicKey: string;
  secretKey: string;
  isTest: boolean;
}

function getIntaSendConfig(): IntaSendConfig | null {
  const publicKey =
    process.env.INTASEND_PUBLIC_KEY?.trim() ||
    process.env.INTASEND_API_KEY?.trim();
  const secretKey = process.env.INTASEND_SECRET_KEY?.trim();

  if (!publicKey || !secretKey) {
    return null;
  }

  const isTest =
    publicKey.includes("_test_") || secretKey.includes("_test_");

  return { publicKey, secretKey, isTest };
}

function ensureIntaSendConfigured(): IntaSendConfig {
  const config = getIntaSendConfig();
  if (!config) {
    throw new IntaSendConfigError(
      "Missing INTASEND_SECRET_KEY and INTASEND_PUBLIC_KEY (or INTASEND_API_KEY)",
    );
  }
  return config;
}

export function isIntaSendConfigured(): boolean {
  return getIntaSendConfig() !== null;
}

export interface IntaSendInvoice {
  invoice_id: string;
  state: string;
  provider?: string;
  value?: string;
  api_ref?: string | null;
  mpesa_reference?: string;
  failed_reason?: string | null;
}

export interface IntaSendStkPushInput {
  phoneNumber: string;
  amount: number;
  apiRef: string;
  narrative?: string;
}

export interface IntaSendStkPushResponse {
  id?: string;
  invoice: IntaSendInvoice;
  CustomerMessage?: string;
}

async function intaSendRequest<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const config = ensureIntaSendConfigured();

  const response = await fetch(`${INTASEND_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.secretKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as T & {
    detail?: string;
    error?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new IntaSendApiError(
      data.detail ?? data.error ?? data.message ?? "IntaSend request failed",
      response.status,
      data,
    );
  }

  return data;
}

/**
 * Trigger M-Pesa STK push via IntaSend.
 */
export async function intaSendMpesaStkPush(
  input: IntaSendStkPushInput,
): Promise<IntaSendStkPushResponse> {
  const phone = normalizeMpesaPhone(input.phoneNumber);

  if (!/^254(7|1)\d{8}$/.test(phone)) {
    throw new IntaSendApiError(
      "Enter a valid Kenyan M-Pesa number (e.g. 07XXXXXXXX)",
    );
  }

  const amount = Math.max(1, Math.round(Number(input.amount)));
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://www.yourhome.africa";

  const data = await intaSendRequest<IntaSendStkPushResponse>(
    "/api/v1/payment/mpesa-stk-push/",
    {
      amount: String(amount),
      phone_number: phone,
      api_ref: input.apiRef.slice(0, 140),
      host: appUrl.replace(/\/$/, ""),
    },
  );

  return {
    ...data,
    CustomerMessage:
      data.invoice?.state === "PROCESSING" || data.invoice?.state === "PENDING"
        ? "Check your phone for the M-Pesa prompt"
        : "M-Pesa payment initiated",
  };
}

export async function intaSendPaymentStatus(invoiceId: string) {
  return intaSendRequest<{ invoice: IntaSendInvoice }>(
    "/api/v1/payment/status/",
    { invoice_id: invoiceId },
  );
}

export function validateIntaSendWebhookChallenge(challenge: unknown): boolean {
  const expected = process.env.INTASEND_WEBHOOK_CHALLENGE?.trim();
  if (!expected) return true;
  return typeof challenge === "string" && challenge === expected;
}

export function intaSendWebhookUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://www.yourhome.africa";
  return `${base.replace(/\/$/, "")}/api/payments/intasend/webhook`;
}
