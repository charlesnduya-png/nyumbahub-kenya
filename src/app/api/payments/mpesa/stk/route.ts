import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createPayment, completePayment } from "@/lib/payments-store";
import { isMpesaConfigured, MpesaConfigError, stkPush } from "@/lib/mpesa";
import { getProduct } from "@/lib/pricing";

const schema = z.object({
  phoneNumber: z.string().min(9),
  amount: z.number().positive().optional(),
  accountReference: z.string().min(1).max(12).optional(),
  description: z.string().min(1).max(100).optional(),
  propertyId: z.string().optional(),
  productId: z.string().optional(),
  confirmDemo: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
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

    const product = parsed.data.productId
      ? getProduct(parsed.data.productId)
      : null;
    const amount = parsed.data.amount ?? product?.price;

    if (!amount) {
      return NextResponse.json(
        { success: false, error: "Amount or productId required" },
        { status: 400 },
      );
    }

    const payment = createPayment({
      userId: session.user.id,
      userEmail: session.user.email,
      productId: product?.id ?? "custom",
      amount,
      phone: parsed.data.phoneNumber,
      propertyId: parsed.data.propertyId,
      method: "MPESA",
    });

    if (parsed.data.confirmDemo || !isMpesaConfigured()) {
      const completed = parsed.data.confirmDemo
        ? completePayment(payment.id)
        : payment;

      return NextResponse.json({
        success: true,
        stub: true,
        data: {
          paymentId: completed?.id ?? payment.id,
          reference: completed?.reference ?? payment.reference,
          status: completed?.status ?? payment.status,
          CustomerMessage: parsed.data.confirmDemo
            ? "Demo payment confirmed"
            : "M-Pesa STK simulated. Use confirmDemo or /api/payments/checkout.",
        },
      });
    }

    const stkResponse = await stkPush({
      phoneNumber: parsed.data.phoneNumber,
      amount,
      accountReference:
        parsed.data.accountReference ?? payment.reference.slice(0, 12),
      transactionDesc:
        parsed.data.description ?? product?.name ?? "NyumbaHub",
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        reference: payment.reference,
        ...stkResponse,
      },
    });
  } catch (error) {
    if (error instanceof MpesaConfigError) {
      return NextResponse.json(
        { success: false, error: error.message, stub: true },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Unable to initiate M-Pesa payment" },
      { status: 500 },
    );
  }
}
