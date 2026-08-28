import { NextResponse } from "next/server";

import { fulfillCompletedPayment } from "@/lib/payment-fulfillment";
import { prisma } from "@/lib/prisma";

type CallbackItem = { Name?: string; Value?: string | number };

function readMeta(
  items: CallbackItem[] | undefined,
  name: string,
): string | null {
  const found = items?.find((item) => item.Name === name);
  if (found?.Value == null) return null;
  return String(found.Value);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const callback = body?.Body?.stkCallback ?? body;

    const resultCode = callback?.ResultCode ?? body?.ResultCode ?? null;
    const checkoutRequestId =
      callback?.CheckoutRequestID ?? body?.CheckoutRequestID ?? null;
    const merchantRequestId =
      callback?.MerchantRequestID ?? body?.MerchantRequestID ?? null;

    const items = callback?.CallbackMetadata?.Item as CallbackItem[] | undefined;
    const mpesaReceipt = readMeta(items, "MpesaReceiptNumber");
    const amountPaid = readMeta(items, "Amount");

    if (resultCode === 0 || resultCode === "0") {
      if (checkoutRequestId || merchantRequestId) {
        const payments = await prisma.payment.findMany({
          where: {
            status: { in: ["PENDING", "COMPLETED"] },
            OR: [
              ...(checkoutRequestId
                ? [
                    { reference: String(checkoutRequestId) },
                    {
                      metadata: {
                        path: ["checkoutRequestId"],
                        equals: String(checkoutRequestId),
                      },
                    },
                  ]
                : []),
              ...(merchantRequestId
                ? [
                    {
                      metadata: {
                        path: ["merchantRequestId"],
                        equals: String(merchantRequestId),
                      },
                    },
                  ]
                : []),
            ],
          },
          take: 10,
        });

          for (const payment of payments) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "COMPLETED",
              mpesaReceipt: mpesaReceipt ?? undefined,
              reference: checkoutRequestId
                ? String(checkoutRequestId)
                : payment.reference,
              metadata: {
                ...((payment.metadata as Record<string, unknown>) ?? {}),
                checkoutRequestId: checkoutRequestId
                  ? String(checkoutRequestId)
                  : undefined,
                merchantRequestId: merchantRequestId
                  ? String(merchantRequestId)
                  : undefined,
                amountPaid: amountPaid ?? undefined,
                callbackAt: new Date().toISOString(),
              },
            },
          });

          await fulfillCompletedPayment({
            id: payment.id,
            userId: payment.userId,
            metadata: payment.metadata,
            amount: amountPaid ? Number(amountPaid) : payment.amount,
            mpesaReceipt: mpesaReceipt ?? undefined,
          });
        }
      }

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
    }

    // Failed / cancelled STK — mark matching pending payments failed
    if (checkoutRequestId || merchantRequestId) {
      await prisma.payment.updateMany({
        where: {
          status: "PENDING",
          OR: [
            ...(checkoutRequestId
              ? [{ reference: String(checkoutRequestId) }]
              : []),
            ...(checkoutRequestId
              ? [
                  {
                    metadata: {
                      path: ["checkoutRequestId"],
                      equals: String(checkoutRequestId),
                    },
                  },
                ]
              : []),
          ],
        },
        data: { status: "FAILED" },
      });
    }

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Callback received",
    });
  } catch (error) {
    console.error("M-Pesa callback error:", error);
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Callback acknowledged",
    });
  }
}
