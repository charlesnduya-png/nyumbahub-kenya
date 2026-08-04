import Stripe from "stripe";
import type { SubscriptionPlan } from "@/types";

export class StripeConfigError extends Error {
  constructor(message = "Stripe is not configured") {
    super(message);
    this.name = "StripeConfigError";
  }
}

const globalForStripe = globalThis as unknown as {
  stripe: Stripe | undefined;
};

function getStripeSecretKey(): string | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

export function isStripeConfigured(): boolean {
  return getStripeSecretKey() !== null;
}

export function getStripe(): Stripe {
  const secretKey = getStripeSecretKey();

  if (!secretKey) {
    throw new StripeConfigError("Missing STRIPE_SECRET_KEY environment variable");
  }

  if (!globalForStripe.stripe) {
    globalForStripe.stripe = new Stripe(secretKey, {
      typescript: true,
    });
  }

  return globalForStripe.stripe;
}

export type CheckoutPurpose = "premium_listing" | "subscription";

export interface CreateCheckoutSessionInput {
  userId: string;
  email: string;
  purpose: CheckoutPurpose;
  propertyId?: string;
  plan?: SubscriptionPlan;
  amount: number;
  currency?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

const PLAN_LABELS: Partial<Record<SubscriptionPlan, string>> = {
  BASIC: "NyumbaHub Basic",
  PREMIUM: "NyumbaHub Premium",
  AGENT_PRO: "NyumbaHub Agent Pro",
  AGENT_ENTERPRISE: "NyumbaHub Agent Enterprise",
};

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  const currency = (input.currency ?? "kes").toLowerCase();

  const productName =
    input.purpose === "premium_listing"
      ? "Premium Property Listing"
      : (input.plan ? PLAN_LABELS[input.plan] : undefined) ?? "NyumbaHub Subscription";

  const description =
    input.purpose === "premium_listing" && input.propertyId
      ? `Boost visibility for property ${input.propertyId}`
      : `Subscription plan: ${input.plan ?? "PREMIUM"}`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: Math.round(input.amount * 100),
          product_data: {
            name: productName,
            description,
          },
        },
      },
    ],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: {
      userId: input.userId,
      purpose: input.purpose,
      propertyId: input.propertyId ?? "",
      plan: input.plan ?? "",
      ...input.metadata,
    },
  });

  return session;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(getStripe(), prop);
  },
});
