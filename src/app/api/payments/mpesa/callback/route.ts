import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const resultCode =
      body?.Body?.stkCallback?.ResultCode ??
      body?.ResultCode ??
      null;

    const checkoutRequestId =
      body?.Body?.stkCallback?.CheckoutRequestID ??
      body?.CheckoutRequestID ??
      null;

    const mpesaReceipt =
      body?.Body?.stkCallback?.CallbackMetadata?.Item?.find?.(
        (item: { Name?: string; Value?: string }) => item.Name === "MpesaReceiptNumber",
      )?.Value ?? null;

    if (resultCode === 0 || resultCode === "0") {
      if (checkoutRequestId) {
        await prisma.payment.updateMany({
          where: { reference: { contains: String(checkoutRequestId).slice(0, 8) } },
          data: {
            status: "COMPLETED",
            mpesaReceipt: mpesaReceipt ?? undefined,
          },
        });
      }

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
    }

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Callback received",
    });
  } catch {
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Callback acknowledged",
    });
  }
}
