/**
 * M-Pesa Daraja API helpers (Safaricom sandbox/production).
 *
 * Required env vars:
 * - MPESA_CONSUMER_KEY
 * - MPESA_CONSUMER_SECRET
 * - MPESA_SHORTCODE (BusinessShortCode / Paybill or Till)
 * - MPESA_PASSKEY (Lipa Na M-Pesa Online passkey from Daraja)
 * - MPESA_CALLBACK_URL (public HTTPS callback)
 * - MPESA_ENV ("sandbox" | "production")
 * - MPESA_TRANSACTION_TYPE (optional: CustomerPayBillOnline | CustomerBuyGoodsOnline)
 */

export class MpesaConfigError extends Error {
  constructor(message = "M-Pesa is not configured") {
    super(message);
    this.name = "MpesaConfigError";
  }
}

export class MpesaApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly responseBody?: unknown,
  ) {
    super(message);
    this.name = "MpesaApiError";
  }
}

interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  callbackUrl: string;
  baseUrl: string;
  transactionType: "CustomerPayBillOnline" | "CustomerBuyGoodsOnline";
}

function getMpesaConfig(): MpesaConfig | null {
  const consumerKey = process.env.MPESA_CONSUMER_KEY?.trim();
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET?.trim();
  const shortcode = process.env.MPESA_SHORTCODE?.trim();
  const passkey = process.env.MPESA_PASSKEY?.trim();
  const callbackUrl = process.env.MPESA_CALLBACK_URL?.trim();
  const env = process.env.MPESA_ENV?.trim().toLowerCase() ?? "sandbox";
  const transactionTypeRaw =
    process.env.MPESA_TRANSACTION_TYPE?.trim() || "CustomerPayBillOnline";
  const transactionType =
    transactionTypeRaw === "CustomerBuyGoodsOnline"
      ? "CustomerBuyGoodsOnline"
      : "CustomerPayBillOnline";

  if (!consumerKey || !consumerSecret || !shortcode || !passkey || !callbackUrl) {
    return null;
  }

  const baseUrl =
    env === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

  return {
    consumerKey,
    consumerSecret,
    shortcode,
    passkey,
    callbackUrl,
    baseUrl,
    transactionType,
  };
}

function ensureMpesaConfigured(): MpesaConfig {
  const config = getMpesaConfig();

  if (!config) {
    throw new MpesaConfigError(
      "Missing M-Pesa env vars: MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_URL",
    );
  }

  return config;
}

export function isMpesaConfigured(): boolean {
  return getMpesaConfig() !== null;
}

export function getMpesaShortcode(): string | null {
  return process.env.MPESA_SHORTCODE?.trim() || null;
}

interface AccessTokenResponse {
  access_token: string;
  expires_in: string;
}

/**
 * Obtain an OAuth access token from Daraja.
 */
export async function getAccessToken(): Promise<string> {
  const config = ensureMpesaConfigured();
  const credentials = Buffer.from(
    `${config.consumerKey}:${config.consumerSecret}`,
  ).toString("base64");

  const response = await fetch(
    `${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    },
  );

  const body = (await response.json()) as AccessTokenResponse & {
    errorMessage?: string;
    error_description?: string;
  };

  if (!response.ok || !body.access_token) {
    throw new MpesaApiError(
      body.errorMessage ??
        body.error_description ??
        "Failed to obtain M-Pesa access token",
      response.status,
      body,
    );
  }

  return body.access_token;
}

export interface StkPushInput {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

/**
 * Generate Lipa Na M-Pesa Online password:
 * Base64(BusinessShortCode + Passkey + Timestamp)
 */
function generatePassword(shortcode: string, passkey: string): {
  password: string;
  timestamp: string;
} {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const timestamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString(
    "base64",
  );

  return { password, timestamp };
}

/**
 * Normalize Kenyan phone numbers to 2547XXXXXXXX / 2541XXXXXXXX.
 */
export function normalizeMpesaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("254") && digits.length >= 12) {
    return digits.slice(0, 12);
  }

  if (digits.startsWith("0") && digits.length >= 10) {
    return `254${digits.slice(1, 10)}`;
  }

  if (digits.length === 9) {
    return `254${digits}`;
  }

  return digits;
}

/**
 * Initiate an STK Push (Lipa Na M-Pesa Online) payment request.
 */
export async function stkPush(input: StkPushInput): Promise<StkPushResponse> {
  const config = ensureMpesaConfigured();
  const accessToken = await getAccessToken();
  const { password, timestamp } = generatePassword(
    config.shortcode,
    config.passkey,
  );
  const phone = normalizeMpesaPhone(input.phoneNumber);

  if (!/^254(7|1)\d{8}$/.test(phone)) {
    throw new MpesaApiError(
      "Enter a valid Kenyan M-Pesa number (e.g. 07XXXXXXXX)",
    );
  }

  const amount = Math.max(1, Math.round(Number(input.amount)));

  const payload = {
    BusinessShortCode: config.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: config.transactionType,
    Amount: amount,
    PartyA: phone,
    PartyB: config.shortcode,
    PhoneNumber: phone,
    CallBackURL: config.callbackUrl,
    AccountReference: input.accountReference.slice(0, 12) || "YourHome",
    TransactionDesc: (input.transactionDesc || "Your Home").slice(0, 13),
  };

  const response = await fetch(
    `${config.baseUrl}/mpesa/stkpush/v1/processrequest`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const body = (await response.json()) as StkPushResponse & {
    errorMessage?: string;
    errorCode?: string;
  };

  if (!response.ok) {
    throw new MpesaApiError(
      body.errorMessage ?? body.ResponseDescription ?? "STK push failed",
      response.status,
      body,
    );
  }

  if (String(body.ResponseCode) !== "0") {
    throw new MpesaApiError(
      body.ResponseDescription ?? body.errorMessage ?? "STK push was not accepted",
      response.status,
      body,
    );
  }

  return body;
}
