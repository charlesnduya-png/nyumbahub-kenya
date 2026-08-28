import { prisma } from "@/lib/prisma";
import {
  getProduct,
  VERIFIED_BADGE_DAYS,
  VERIFIED_BADGE_PRODUCT_ID,
} from "@/lib/pricing";

export async function activateVerifiedBadge(input: {
  userId: string;
  paymentId?: string;
  amount?: number;
}) {
  const product = getProduct(VERIFIED_BADGE_PRODUCT_ID);
  const days = product?.durationDays ?? VERIFIED_BADGE_DAYS;
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: input.userId },
      data: {
        verificationStatus: "VERIFIED",
        nationalIdVerified: "VERIFIED",
      },
    });

    const agent = await tx.agent.findUnique({
      where: { userId: input.userId },
      select: { id: true },
    });

    if (agent) {
      await tx.agent.update({
        where: { id: agent.id },
        data: {
          isVerified: true,
          verificationStatus: "VERIFIED",
        },
      });
    }

    if (input.paymentId) {
      const payment = await tx.payment.findUnique({
        where: { id: input.paymentId },
        select: { metadata: true },
      });

      await tx.payment.update({
        where: { id: input.paymentId },
        data: {
          metadata: {
            ...((payment?.metadata as Record<string, unknown>) ?? {}),
            productId: VERIFIED_BADGE_PRODUCT_ID,
            verifiedBadgeExpiresAt: endDate.toISOString(),
          },
        },
      });
    }
  });

  return { expiresAt: endDate };
}
