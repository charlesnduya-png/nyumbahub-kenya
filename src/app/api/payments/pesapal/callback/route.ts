import { NextResponse } from "next/server";

import { syncPaymentStatus } from "@/lib/payment-sync";
import { prisma } from "@/lib/prisma";

/**
 * Browser return URL after Pesapal checkout.
 * Verifies status, fulfills the product, then sends the user back to the app.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const paymentId = url.searchParams.get("paymentId");
  const orderTrackingId =
    url.searchParams.get("OrderTrackingId") ||
    url.searchParams.get("orderTrackingId");

  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    "https://www.yourhome.africa"
  ).replace(/\/$/, "");

  if (!paymentId) {
    return NextResponse.redirect(`${appUrl}/pricing?pesapal=missing`);
  }

  try {
    if (orderTrackingId) {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        select: { metadata: true },
      });
      const meta = (payment?.metadata as Record<string, unknown>) ?? {};
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          metadata: {
            ...meta,
            pesapalOrderTrackingId: orderTrackingId,
            provider: "pesapal",
          },
        },
      });
    }

    const result = await syncPaymentStatus(paymentId);
    const status = result.success ? result.data.status : "PENDING";

    if (status === "COMPLETED") {
      return NextResponse.redirect(
        `${appUrl}/dashboard/seller/promote?paid=${encodeURIComponent(paymentId)}`,
      );
    }
    if (status === "FAILED") {
      return NextResponse.redirect(
        `${appUrl}/pricing?pesapal=failed&paymentId=${encodeURIComponent(paymentId)}`,
      );
    }
    return NextResponse.redirect(
      `${appUrl}/dashboard/seller/promote?pending=${encodeURIComponent(paymentId)}`,
    );
  } catch (error) {
    console.error("pesapal callback failed:", error);
    return NextResponse.redirect(
      `${appUrl}/pricing?pesapal=error&paymentId=${encodeURIComponent(paymentId)}`,
    );
  }
}
