import { NextResponse } from "next/server";

import { fulfillCompletedPayment } from "@/lib/payment-fulfillment";
import {
  mapPesapalStatusCode,
  pesapalGetTransactionStatus,
} from "@/lib/pesapal";
import { prisma } from "@/lib/prisma";

/**
 * Pesapal IPN (Instant Payment Notification).
 * Registered as GET; Pesapal also may POST — handle both.
 */
async function handleIpn(request: Request) {
  const url = new URL(request.url);
  let orderTrackingId =
    url.searchParams.get("OrderTrackingId") ||
    url.searchParams.get("orderTrackingId") ||
    url.searchParams.get("OrderTrackingID");
  let merchantReference =
    url.searchParams.get("OrderMerchantReference") ||
    url.searchParams.get("orderMerchantReference");

  if (request.method === "POST") {
    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (body) {
      orderTrackingId =
        orderTrackingId ||
        String(
          body.OrderTrackingId ??
            body.orderTrackingId ??
            body.order_tracking_id ??
            "",
        ) ||
        null;
      merchantReference =
        merchantReference ||
        String(
          body.OrderMerchantReference ??
            body.orderMerchantReference ??
            body.merchant_reference ??
            "",
        ) ||
        null;
    }
  }

  if (!orderTrackingId && !merchantReference) {
    return NextResponse.json(
      { status: 500, message: "Missing tracking id" },
      { status: 400 },
    );
  }

  const payment =
    (merchantReference
      ? await prisma.payment.findFirst({
          where: {
            OR: [
              { id: merchantReference },
              { reference: merchantReference },
              {
                metadata: {
                  path: ["pesapalMerchantReference"],
                  equals: merchantReference,
                },
              },
            ],
          },
        })
      : null) ??
    (orderTrackingId
      ? await prisma.payment.findFirst({
          where: {
            metadata: {
              path: ["pesapalOrderTrackingId"],
              equals: orderTrackingId,
            },
          },
        })
      : null);

  if (!payment) {
    return NextResponse.json({
      orderNotificationType: "IPNCHANGE",
      orderTrackingId: orderTrackingId ?? "",
      orderMerchantReference: merchantReference ?? "",
      status: 200,
      message: "No matching payment",
    });
  }

  const trackingId =
    orderTrackingId ||
    String(
      ((payment.metadata as Record<string, unknown>) ?? {})
        .pesapalOrderTrackingId ?? "",
    );

  if (!trackingId) {
    return NextResponse.json({
      orderNotificationType: "IPNCHANGE",
      orderTrackingId: "",
      orderMerchantReference: payment.id,
      status: 200,
    });
  }

  const remote = await pesapalGetTransactionStatus(trackingId);
  const mapped = mapPesapalStatusCode(remote.status_code);
  const existingMeta = (payment.metadata as Record<string, unknown>) ?? {};

  if (mapped === "COMPLETED" && payment.status !== "COMPLETED") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        mpesaReceipt: remote.confirmation_code ?? payment.mpesaReceipt ?? undefined,
        metadata: {
          ...existingMeta,
          pesapalOrderTrackingId: trackingId,
          pesapalStatusCode: remote.status_code,
          pesapalPaymentMethod: remote.payment_method ?? null,
          pesapalConfirmation: remote.confirmation_code ?? null,
          provider: "pesapal",
        },
      },
    });

    await fulfillCompletedPayment({
      id: payment.id,
      userId: payment.userId,
      metadata: {
        ...existingMeta,
        productId: existingMeta.productId,
        propertyId: existingMeta.propertyId,
      },
      amount: remote.amount ? Number(remote.amount) : payment.amount,
      mpesaReceipt: remote.confirmation_code,
    });
  } else if (mapped === "FAILED" && payment.status === "PENDING") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        metadata: {
          ...existingMeta,
          pesapalOrderTrackingId: trackingId,
          pesapalStatusCode: remote.status_code,
          provider: "pesapal",
        },
      },
    });
  }

  return NextResponse.json({
    orderNotificationType: "IPNCHANGE",
    orderTrackingId: trackingId,
    orderMerchantReference: payment.id,
    status: 200,
  });
}

export async function GET(request: Request) {
  try {
    return await handleIpn(request);
  } catch (error) {
    console.error("pesapal IPN failed:", error);
    return NextResponse.json(
      { status: 500, message: "IPN processing failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    return await handleIpn(request);
  } catch (error) {
    console.error("pesapal IPN failed:", error);
    return NextResponse.json(
      { status: 500, message: "IPN processing failed" },
      { status: 500 },
    );
  }
}
