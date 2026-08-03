/**
 * M-Pesa Daraja API helpers (Safaricom sandbox/production).
 *
 * Sandbox base URL: https://sandbox.safaricom.co.ke
 * Production base URL: https://api.safaricom.co.ke
 *
 * Required env vars:
 * - MPESA_CONSUMER_KEY
 * - MPESA_CONSUMER_SECRET
 * - MPESA_SHORTCODE (Paybill or Till number)
 * - MPESA_PASSKEY (Lipa Na M-Pesa online passkey)
 * - MPESA_CALLBACK_URL (your STK callback endpoint)
 * - MPESA_ENV ("sandbox" | "production")
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
}

function getMpesaConfig(): MpesaConfig | null {
  const consumerKey = process.env.MPESA_CONSUMER_KEY?.trim();
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET?.trim();
  const shortcode = process.env.MPESA_SHORTCODE?.trim();
  const passkey = process.env.MPESA_PASSKEY?.trim();
  const callbackUrl = process.env.MPESA_CALLBACK_URL?.trim();
  const env = process.env.MPESA_ENV?.trim().toLowerCase() ?? "sandbox";

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

interface AccessTokenResponse {
  access_token: string;
  expires_in: string;
}

/**
 * Obtain an OAuth access token from Daraja.
 * Tokens expire after ~3599 seconds; cache in production (Redis/in-memory).
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
  };

  if (!response.ok || !body.access_token) {
    throw new MpesaApiError(
      body.errorMessage ?? "Failed to obtain M-Pesa access token",
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
 * Generate the Lipa Na M-Pesa Online password:
 * Base64(Shortcode + Passkey + Timestamp)
 */
function generatePassword(shortcode: string, passkey: string): {
  password: string;
  timestamp: string;
} {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);

  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString(
    "base64",
  );

  return { password, timestamp };
}

/**
 * Normalize Kenyan phone numbers to 2547XXXXXXXX format.
 */
export function normalizeMpesaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("254")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `254${digits.slice(1)}`;
  }

  if (digits.length === 9) {
    return `254${digits}`;
  }

  return digits;
}

/**
 * Initiate an STK Push (Lipa Na M-Pesa Online) payment request.
 * This is a sandbox-ready stub; wire the callback handler to confirm payment.
 */
export async function stkPush(input: StkPushInput): Promise<StkPushResponse> {
  const config = ensureMpesaConfigured();
  const accessToken = await getAccessToken();
  const { password, timestamp } = generatePassword(
    config.shortcode,
    config.passkey,
  );

  const payload = {
    BusinessShortCode: config.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(input.amount),
    PartyA: normalizeMpesaPhone(input.phoneNumber),
    PartyB: config.shortcode,
    PhoneNumber: normalizeMpesaPhone(input.phoneNumber),
    CallBackURL: config.callbackUrl,
    AccountReference: input.accountReference.slice(0, 12),
    TransactionDesc: input.transactionDesc.slice(0, 13),
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
  };

  if (!response.ok) {
    throw new MpesaApiError(
      body.errorMessage ?? body.ResponseDescription ?? "STK push failed",
      response.status,
      body,
    );
  }

  if (body.ResponseCode !== "0") {
    throw new MpesaApiError(
      body.ResponseDescription ?? "STK push was not accepted",
      response.status,
      body,
    );
  }

  return body;
}
