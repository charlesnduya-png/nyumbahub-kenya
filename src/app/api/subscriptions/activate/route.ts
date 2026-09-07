import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { resolveProfessionalActingContext } from "@/lib/account-team";
import {
  activateListingSubscription,
  isMonthlyListingProduct,
} from "@/lib/listing-subscription";
import { completePayment, getPayment } from "@/lib/payments-store";
import { syncPaymentStatus } from "@/lib/payment-sync";
import { getProduct } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  paymentId: z.string().min(1),
  productId: z.string().min(1).optional(),
});

/**
 * Activate / renew monthly listing access after a payment.
 * Subscription is always attached to the professional workspace owner
 * (team members pay on behalf of the owner account).
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

    const ctx = await resolveProfessionalActingContext(session.user.id);
    const ownerUserId = ctx.actingOwnerId || session.user.id;

    // Prefer live provider sync so PENDING M-Pesa can become COMPLETED first
    await syncPaymentStatus(parsed.data.paymentId, session.user.id).catch(
      () => null,
    );

    let payment = getPayment(parsed.data.paymentId);

    const dbPayment = await prisma.payment.findUnique({
      where: { id: parsed.data.paymentId },
    });

    if (dbPayment) {
      if (
        dbPayment.userId !== session.user.id &&
        dbPayment.userId !== ownerUserId
      ) {
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

      if (dbPayment.status !== "COMPLETED") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Payment is not completed yet. Finish the M-Pesa prompt, then try again.",
            code: "PAYMENT_PENDING",
            data: { status: dbPayment.status },
          },
          { status: 402 },
        );
      }

      const product = getProduct(productId);
      const subscription = await activateListingSubscription({
        userId: ownerUserId,
        productId,
        amount: dbPayment.amount,
        paymentId: dbPayment.id,
        durationDays: product?.durationDays,
      });

      // Ensure payment is linked to the owner who holds the listing entitlement
      if (dbPayment.userId !== ownerUserId) {
        await prisma.payment
          .update({
            where: { id: dbPayment.id },
            data: { userId: ownerUserId },
          })
          .catch(() => null);
      }

      return NextResponse.json({
        success: true,
        data: {
          subscription,
          endDate: subscription.endDate?.toISOString() ?? null,
          paymentId: dbPayment.id,
        },
        message: "Monthly listing plan activated — you can submit listings now",
      });
    }

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 },
      );
    }

    if (payment.userId !== session.user.id && payment.userId !== ownerUserId) {
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
      userId: ownerUserId,
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
      message: "Monthly listing plan activated — you can submit listings now",
    });
  } catch (error) {
    console.error("Subscription activate failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to activate subscription" },
      { status: 500 },
    );
  }
}
