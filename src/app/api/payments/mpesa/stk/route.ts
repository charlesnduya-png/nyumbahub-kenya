import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { createPayment } from "@/lib/payments-store";
import {
  IntaSendApiError,
  IntaSendConfigError,
  intaSendMpesaStkPush,
  isIntaSendConfigured,
} from "@/lib/intasend";
import {
  isMpesaConfigured,
  MpesaApiError,
  MpesaConfigError,
  stkPush,
} from "@/lib/mpesa";
import { getProductWithLivePricing } from "@/lib/hotel-plan-pricing";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  phoneNumber: z.string().min(9),
  amount: z.number().positive().optional(),
  accountReference: z.string().min(1).max(12).optional(),
  description: z.string().min(1).max(100).optional(),
  propertyId: z.string().optional(),
  productId: z.string().optional(),
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

    if (!isIntaSendConfigured() && !isMpesaConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "M-Pesa is not configured. Add IntaSend keys or Daraja credentials.",
          code: "MPESA_NOT_CONFIGURED",
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

    const product = parsed.data.productId
      ? await getProductWithLivePricing(parsed.data.productId)
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
      metadata: {
        type: "PAYMENT",
      },
    });

    try {
      await prisma.payment.create({
        data: {
          id: payment.id,
          userId: session.user.id,
          amount,
          currency: "KES",
          method: "MPESA",
          status: "PENDING",
          reference: payment.reference,
          description:
            parsed.data.description ?? product?.name ?? "Your Home payment",
          metadata: {
            productId: product?.id ?? null,
            propertyId: parsed.data.propertyId ?? null,
            type: "PAYMENT",
          },
        },
      });
    } catch {
      // ignore persist race
    }

    if (isIntaSendConfigured()) {
      const stk = await intaSendMpesaStkPush({
        phoneNumber: parsed.data.phoneNumber,
        amount,
        apiRef: payment.id,
        narrative:
          parsed.data.description ?? product?.name ?? "Your Home payment",
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          metadata: {
            productId: product?.id ?? null,
            propertyId: parsed.data.propertyId ?? null,
            type: "PAYMENT",
            intasendInvoiceId: stk.invoice?.invoice_id,
            intasendSessionId: stk.id,
            provider: "intasend",
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          paymentId: payment.id,
          reference: payment.reference,
          intasendInvoiceId: stk.invoice?.invoice_id,
          CustomerMessage:
            stk.CustomerMessage ||
            "M-Pesa prompt sent. Enter your PIN on your phone.",
        },
        message:
          stk.CustomerMessage ||
          "M-Pesa prompt sent. Enter your PIN on your phone.",
      });
    }

    const stkResponse = await stkPush({
      phoneNumber: parsed.data.phoneNumber,
      amount,
      accountReference:
        parsed.data.accountReference ?? payment.reference.slice(0, 12),
      transactionDesc:
        parsed.data.description ?? product?.name ?? "Your Home",
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        reference: stkResponse.CheckoutRequestID || payment.reference,
        metadata: {
          productId: product?.id ?? null,
          propertyId: parsed.data.propertyId ?? null,
          type: "PAYMENT",
          checkoutRequestId: stkResponse.CheckoutRequestID,
          merchantRequestId: stkResponse.MerchantRequestID,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        reference: stkResponse.CheckoutRequestID || payment.reference,
        CheckoutRequestID: stkResponse.CheckoutRequestID,
        MerchantRequestID: stkResponse.MerchantRequestID,
        CustomerMessage: stkResponse.CustomerMessage,
        ResponseDescription: stkResponse.ResponseDescription,
      },
      message:
        stkResponse.CustomerMessage ||
        "M-Pesa prompt sent. Enter your PIN on your phone.",
    });
  } catch (error) {
    if (error instanceof MpesaConfigError || error instanceof IntaSendConfigError) {
      return NextResponse.json(
        { success: false, error: error.message, code: "MPESA_NOT_CONFIGURED" },
        { status: 503 },
      );
    }
    if (error instanceof IntaSendApiError) {
      return NextResponse.json(
        { success: false, error: error.message, details: error.responseBody },
        { status: 502 },
      );
    }
    if (error instanceof MpesaApiError) {
      return NextResponse.json(
        { success: false, error: error.message, details: error.responseBody },
        { status: 502 },
      );
    }

    console.error("M-Pesa STK error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to initiate M-Pesa payment" },
      { status: 500 },
    );
  }
}
