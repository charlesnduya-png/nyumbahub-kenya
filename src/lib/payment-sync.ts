import { prisma } from "@/lib/prisma";
import { intaSendPaymentStatus } from "@/lib/intasend";
import { fulfillCompletedPayment } from "@/lib/payment-fulfillment";

type PaymentMeta = {
  productId?: string;
  propertyId?: string | null;
  intasendInvoiceId?: string;
  fulfilledAt?: string;
};

export async function syncPaymentStatus(paymentId: string, userId?: string) {
  let payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    return { success: false as const, error: "Payment not found" };
  }

  if (userId && payment.userId !== userId) {
    return { success: false as const, error: "Forbidden" };
  }

  let meta = (payment.metadata ?? {}) as PaymentMeta;

  if (payment.status !== "COMPLETED" && meta.intasendInvoiceId) {
    try {
      const remote = await intaSendPaymentStatus(meta.intasendInvoiceId);
      const state = String(remote.invoice?.state ?? "").toUpperCase();

      if (state === "COMPLETE") {
        meta = {
          ...meta,
          intasendState: state,
          amountPaid: remote.invoice.value ?? String(payment.amount),
          syncedAt: new Date().toISOString(),
        };

        payment = await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "COMPLETED",
            mpesaReceipt:
              remote.invoice.mpesa_reference ?? payment.mpesaReceipt ?? undefined,
            metadata: meta,
          },
        });
      } else if (state === "FAILED" || state === "CANCELED") {
        payment = await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "FAILED",
            metadata: {
              ...meta,
              intasendState: state,
              failedReason: remote.invoice.failed_reason,
              syncedAt: new Date().toISOString(),
            },
          },
        });

        return {
          success: true as const,
          data: {
            paymentId: payment.id,
            status: payment.status,
            fulfilled: false,
            productId: meta.productId ?? null,
          },
        };
      }
    } catch {
      // keep current DB state
    }
  }

  if (payment.status === "COMPLETED") {
    await fulfillCompletedPayment({
      id: payment.id,
      userId: payment.userId,
      metadata: meta,
      amount: payment.amount,
      mpesaReceipt: payment.mpesaReceipt,
    });

    const refreshed = await prisma.payment.findUnique({
      where: { id: paymentId },
    });
    meta = (refreshed?.metadata ?? meta) as PaymentMeta;

    return {
      success: true as const,
      data: {
        paymentId,
        status: refreshed?.status ?? payment.status,
        fulfilled: Boolean(meta.fulfilledAt),
        productId: meta.productId ?? null,
      },
    };
  }

  return {
    success: true as const,
    data: {
      paymentId,
      status: payment.status,
      fulfilled: Boolean(meta.fulfilledAt),
      productId: meta.productId ?? null,
    },
  };
}
