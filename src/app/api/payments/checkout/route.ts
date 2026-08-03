import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  completePayment,
  createPayment,
  getPayment,
} from "@/lib/payments-store";
import { isMpesaConfigured, MpesaConfigError, stkPush } from "@/lib/mpesa";
import { getProduct } from "@/lib/pricing";
import { createCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  productId: z.string().min(1),
  phoneNumber: z.string().min(9).optional(),
  propertyId: z.string().optional(),
  method: z.enum(["MPESA", "CARD"]).default("MPESA"),
  /** Instantly mark paid for local demo when M-Pesa keys are missing */
  confirmDemo: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Sign in required to pay" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid checkout request" },
        { status: 400 },
      );
    }

    const product = getProduct(parsed.data.productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Unknown pricing product" },
        { status: 400 },
      );
    }

    const payment = createPayment({
      userId: session.user.id,
      userEmail: session.user.email,
      productId: product.id,
      amount: product.price,
      phone: parsed.data.phoneNumber,
      propertyId: parsed.data.propertyId,
      method: parsed.data.method,
      metadata: {
        durationDays: product.durationDays,
        listingFlags: product.listingFlags ?? null,
        category: product.category,
      },
    });

    // Persist when DB is available (best effort)
    try {
      await prisma.payment.create({
        data: {
          id: payment.id,
          userId: session.user.id,
          amount: payment.amount,
          currency: "KES",
          method: parsed.data.method === "CARD" ? "CARD" : "MPESA",
          status: "PENDING",
          reference: payment.reference,
          description: payment.description,
          metadata: {
            productId: product.id,
            propertyId: parsed.data.propertyId ?? null,
          },
        },
      });
    } catch {
      // demo store already has the payment
    }

    // Demo instant confirm
    if (parsed.data.confirmDemo) {
      const completed = completePayment(payment.id);
      try {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "COMPLETED" },
        });
      } catch {
        // ignore
      }

      return NextResponse.json({
        success: true,
        stub: true,
        data: {
          id: completed!.id,
          reference: completed!.reference,
          productId: product.id,
          amount: completed!.amount,
          status: "COMPLETED",
          listingFlags: product.listingFlags ?? null,
          category: product.category,
        },
      });
    }

    if (parsed.data.method === "CARD") {
      if (!isStripeConfigured()) {
        return NextResponse.json({
          success: true,
          stub: true,
          data: {
            id: payment.id,
            reference: payment.reference,
            productId: product.id,
            amount: payment.amount,
            status: "PENDING",
            message:
              "Stripe is not configured. Use Confirm demo payment or M-Pesa.",
          },
        });
      }

      const sessionCheckout = await createCheckoutSession({
        userId: session.user.id,
        email: session.user.email ?? "billing@nyumbahub.co.ke",
        purpose:
          product.category === "subscription"
            ? "subscription"
            : "premium_listing",
        propertyId: parsed.data.propertyId,
        amount: product.price,
        currency: "kes",
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/seller/promote?paid=${payment.id}`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
        metadata: {
          paymentId: payment.id,
          productId: product.id,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: payment.id,
          reference: payment.reference,
          checkoutUrl: sessionCheckout.url,
          status: "PENDING",
        },
      });
    }

    // M-Pesa
    if (!isMpesaConfigured()) {
      return NextResponse.json({
        success: true,
        stub: true,
        data: {
          id: payment.id,
          reference: payment.reference,
          productId: product.id,
          amount: payment.amount,
          status: "PENDING",
          CustomerMessage:
            "M-Pesa not configured. Use Confirm demo payment to continue.",
        },
      });
    }

    try {
      const stk = await stkPush({
        phoneNumber: parsed.data.phoneNumber || "0712345678",
        amount: product.price,
        accountReference: payment.reference.slice(0, 12),
        transactionDesc: product.name,
      });

      return NextResponse.json({
        success: true,
        data: {
          id: payment.id,
          reference: payment.reference,
          productId: product.id,
          amount: product.price,
          status: "PENDING",
          ...stk,
        },
      });
    } catch (error) {
      if (error instanceof MpesaConfigError) {
        return NextResponse.json(
          { success: false, error: error.message, stub: true },
          { status: 503 },
        );
      }
      throw error;
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "Checkout failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
  }

  const payment = getPayment(id);
  if (!payment || payment.userId !== session.user.id) {
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
  }

  return NextResponse.json({ success: true, data: payment });
}
