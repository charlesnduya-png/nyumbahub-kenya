/**
 * Pesapal API 3.0 — card (Visa/Mastercard) and other methods via hosted checkout.
 *
 * Env:
 * - PESAPAL_CONSUMER_KEY
 * - PESAPAL_CONSUMER_SECRET
 * - PESAPAL_ENV=production|sandbox (default production)
 * - PESAPAL_IPN_ID (optional — registered automatically if missing)
 * - NEXT_PUBLIC_APP_URL — callback + IPN base URL
 */

const LIVE_BASE = "https://pay.pesapal.com/v3";
const SANDBOX_BASE = "https://cybqa.pesapal.com/pesapalv3";

type TokenCache = { token: string; expiresAt: number };
let tokenCache: TokenCache | null = null;
let cachedIpnId: string | null = null;

export class PesapalConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PesapalConfigError";
  }
}

export class PesapalApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PesapalApiError";
  }
}

function pesapalBaseUrl() {
  const env = (process.env.PESAPAL_ENV ?? "production").trim().toLowerCase();
  return env === "sandbox" ? SANDBOX_BASE : LIVE_BASE;
}

export function isPesapalConfigured() {
  return Boolean(
    process.env.PESAPAL_CONSUMER_KEY?.trim() &&
      process.env.PESAPAL_CONSUMER_SECRET?.trim(),
  );
}

function requireKeys() {
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY?.trim();
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET?.trim();
  if (!consumerKey || !consumerSecret) {
    throw new PesapalConfigError(
      "Missing PESAPAL_CONSUMER_KEY or PESAPAL_CONSUMER_SECRET",
    );
  }
  return { consumerKey, consumerSecret };
}

function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    "https://www.yourhome.africa"
  ).replace(/\/$/, "");
}

export function pesapalIpnUrl() {
  return `${appBaseUrl()}/api/payments/pesapal/ipn`;
}

export function pesapalCallbackUrl(paymentId: string) {
  return `${appBaseUrl()}/api/payments/pesapal/callback?paymentId=${encodeURIComponent(paymentId)}`;
}

export function pesapalCancellationUrl(paymentId: string) {
  return `${appBaseUrl()}/payments/card/cancel?paymentId=${encodeURIComponent(paymentId)}`;
}

async function pesapalFetch<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...rest } = init;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(rest.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${pesapalBaseUrl()}${path}`, {
    ...rest,
    headers,
  });

  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { message: text };
  }

  if (!response.ok) {
    const err = json as { message?: string; error?: { message?: string } } | null;
    throw new PesapalApiError(
      err?.error?.message ||
        err?.message ||
        `Pesapal request failed (${response.status})`,
    );
  }

  return json as T;
}

export async function pesapalRequestToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }

  const { consumerKey, consumerSecret } = requireKeys();
  const data = await pesapalFetch<{
    token?: string;
    expiryDate?: string;
    error?: unknown;
    message?: string;
    status?: string;
  }>("/api/Auth/RequestToken", {
    method: "POST",
    body: JSON.stringify({
      consumer_key: consumerKey,
      consumer_secret: consumerSecret,
    }),
  });

  if (!data.token) {
    throw new PesapalApiError(data.message || "Pesapal auth failed");
  }

  const expiresAt = data.expiryDate
    ? Date.parse(data.expiryDate)
    : Date.now() + 4 * 60 * 1000;
  tokenCache = {
    token: data.token,
    expiresAt: Number.isFinite(expiresAt) ? expiresAt : Date.now() + 4 * 60 * 1000,
  };
  return data.token;
}

async function registerIpn(token: string) {
  const data = await pesapalFetch<{
    ipn_id?: string;
    message?: string;
  }>("/api/URLSetup/RegisterIPN", {
    method: "POST",
    token,
    body: JSON.stringify({
      url: pesapalIpnUrl(),
      ipn_notification_type: "GET",
    }),
  });

  if (!data.ipn_id) {
    throw new PesapalApiError(data.message || "Could not register Pesapal IPN");
  }
  return data.ipn_id;
}

export async function getPesapalNotificationId() {
  const fromEnv = process.env.PESAPAL_IPN_ID?.trim();
  if (fromEnv) return fromEnv;
  if (cachedIpnId) return cachedIpnId;

  const token = await pesapalRequestToken();
  cachedIpnId = await registerIpn(token);
  return cachedIpnId;
}

export async function pesapalSubmitOrder(input: {
  merchantReference: string;
  amount: number;
  description: string;
  callbackUrl: string;
  cancellationUrl?: string;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}) {
  const token = await pesapalRequestToken();
  const notificationId = await getPesapalNotificationId();

  const data = await pesapalFetch<{
    order_tracking_id?: string;
    merchant_reference?: string;
    redirect_url?: string;
    error?: { message?: string } | null;
    message?: string;
  }>("/api/Transactions/SubmitOrderRequest", {
    method: "POST",
    token,
    body: JSON.stringify({
      id: input.merchantReference.slice(0, 50),
      currency: "KES",
      amount: Number(input.amount.toFixed(2)),
      description: input.description.slice(0, 100),
      callback_url: input.callbackUrl,
      notification_id: notificationId,
      // PARENT_WINDOW keeps callback on our site when checkout is iframed
      redirect_mode: "PARENT_WINDOW",
      cancellation_url: input.cancellationUrl || undefined,
      billing_address: {
        email_address: input.email || "billing@yourhome.co.ke",
        phone_number: input.phone || undefined,
        country_code: "KE",
        first_name: input.firstName || "Your",
        last_name: input.lastName || "Home",
      },
    }),
  });

  if (!data.redirect_url || !data.order_tracking_id) {
    throw new PesapalApiError(
      data.error?.message || data.message || "Pesapal did not return a checkout URL",
    );
  }

  return {
    orderTrackingId: data.order_tracking_id,
    merchantReference: data.merchant_reference ?? input.merchantReference,
    redirectUrl: data.redirect_url,
  };
}

/** status_code: 0 INVALID, 1 COMPLETED, 2 FAILED, 3 REVERSED */
export async function pesapalGetTransactionStatus(orderTrackingId: string) {
  const token = await pesapalRequestToken();
  return pesapalFetch<{
    payment_method?: string;
    amount?: number;
    created_date?: string;
    confirmation_code?: string;
    payment_status_description?: string;
    description?: string;
    message?: string;
    payment_account?: string;
    status_code?: number;
    merchant_reference?: string;
    currency?: string;
  }>(
    `/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
    { method: "GET", token },
  );
}

export function mapPesapalStatusCode(statusCode?: number) {
  switch (statusCode) {
    case 1:
      return "COMPLETED" as const;
    case 2:
    case 3:
      return "FAILED" as const;
    default:
      return "PENDING" as const;
  }
}
