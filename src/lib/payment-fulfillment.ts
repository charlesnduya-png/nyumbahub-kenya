import { prisma } from "@/lib/prisma";

type PaymentMeta = {
  productId?: string;
  fulfilledAt?: string;
};

/**
 * Apply product-specific side effects after a payment is marked COMPLETED.
 * Idempotent — skips if metadata.fulfilledAt is already set.
 */
export async function fulfillCompletedPayment(payment: {
  id: string;
  userId: string;
  metadata: unknown;
  amount?: number;
  mpesaReceipt?: string | null;
}) {
  const meta = (payment.metadata ?? {}) as PaymentMeta;
  if (meta.fulfilledAt) {
    return;
  }

  const amountPaid = payment.amount;

  if (meta.productId === "tenant_access_24h" && payment.userId) {
    const { activateTenantAccess } = await import("@/lib/tenant-access");
    await activateTenantAccess({
      userId: payment.userId,
      paymentId: payment.id,
      amount: amountPaid,
    }).catch(() => null);
  }

  if (meta.productId === "verified_badge" && payment.userId) {
    const { activateVerifiedBadge } = await import("@/lib/verification-badge");
    await activateVerifiedBadge({
      userId: payment.userId,
      paymentId: payment.id,
      amount: amountPaid,
    }).catch(() => null);
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      metadata: {
        ...meta,
        fulfilledAt: new Date().toISOString(),
      },
    },
  });
}
