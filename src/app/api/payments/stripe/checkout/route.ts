import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  createCheckoutSession,
  isStripeConfigured,
  StripeConfigError,
} from "@/lib/stripe";
import { APP_URL } from "@/lib/seo";

const schema = z.object({
  purpose: z.enum(["premium_listing", "subscription"]),
  propertyId: z.string().optional(),
  plan: z
    .enum(["BASIC", "PREMIUM", "AGENT_PRO", "AGENT_ENTERPRISE"])
    .optional(),
  amount: z.number().positive(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: "Stripe is not configured",
        },
        { status: 503 },
      );
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 },
      );
    }

    const checkoutSession = await createCheckoutSession({
      userId: session.user.id,
      email: session.user.email,
      purpose: parsed.data.purpose,
      propertyId: parsed.data.propertyId,
      plan: parsed.data.plan,
      amount: parsed.data.amount,
      successUrl: `${APP_URL}/dashboard/seller/promote?success=1`,
      cancelUrl: `${APP_URL}/dashboard/seller/promote?cancelled=1`,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
      },
    });
  } catch (error) {
    if (error instanceof StripeConfigError) {
      return NextResponse.json(
        { success: false, error: error.message, stub: true },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Unable to create checkout session" },
      { status: 500 },
    );
  }
}
