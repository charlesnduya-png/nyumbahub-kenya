import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  activateListingSubscription,
  isMonthlyListingProduct,
} from "@/lib/listing-subscription";
import { completePayment, getPayment } from "@/lib/payments-store";
import { getProduct } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  paymentId: z.string().min(1),
  productId: z.string().min(1).optional(),
});

/**
 * Activate / renew monthly listing access after a payment.
 * Completes the in-memory payment when M-Pesa/Stripe is not finishing it yet.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Sign in required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 },
      );
    }

    let payment = getPayment(parsed.data.paymentId);

    // Fall back to Prisma payment if in-memory store lost it (serverless)
    if (!payment) {
      const dbPayment = await prisma.payment.findUnique({
        where: { id: parsed.data.paymentId },
      });
      if (!dbPayment || dbPayment.userId !== session.user.id) {
        return NextResponse.json(
          { success: false, error: "Payment not found" },
          { status: 404 },
        );
      }

      const meta = (dbPayment.metadata ?? {}) as { productId?: string };
      const productId =
        parsed.data.productId ?? meta.productId ?? "standard";

      if (!isMonthlyListingProduct(productId)) {
        return NextResponse.json(
          { success: false, error: "Not a monthly listing plan" },
          { status: 400 },
        );
      }

      const product = getProduct(productId);
      const subscription = await activateListingSubscription({
        userId: session.user.id,
        productId,
        amount: dbPayment.amount,
        paymentId: dbPayment.id,
        durationDays: product?.durationDays,
      });

      return NextResponse.json({
        success: true,
        data: {
          subscription,
          endDate: subscription.endDate?.toISOString() ?? null,
        },
        message: "Monthly listing plan activated",
      });
    }

    if (payment.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Payment does not belong to this account" },
        { status: 403 },
      );
    }

    const productId = parsed.data.productId ?? payment.productId;
    if (!isMonthlyListingProduct(String(productId))) {
      return NextResponse.json(
        { success: false, error: "Not a monthly listing plan" },
        { status: 400 },
      );
    }

    if (payment.status !== "COMPLETED") {
      completePayment(payment.id);
      payment = getPayment(payment.id) ?? payment;
    }

    const product = getProduct(String(productId));
    const subscription = await activateListingSubscription({
      userId: session.user.id,
      productId: String(productId),
      amount: payment.amount,
      paymentId: payment.id,
      durationDays: product?.durationDays,
    });

    return NextResponse.json({
      success: true,
      data: {
        subscription,
        endDate: subscription.endDate?.toISOString() ?? null,
        paymentId: payment.id,
      },
      message: "Monthly listing plan activated — list unlimited properties this month",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to activate subscription" },
      { status: 500 },
    );
  }
}
