import { membershipForStays, staysToNextLevel } from "@/lib/membership";
import { prisma } from "@/lib/prisma";

export async function getCustomerMembership(userId: string) {
  const [completed, checkedOut] = await Promise.all([
    prisma.booking.count({
      where: { guestId: userId, status: "COMPLETED" },
    }),
    prisma.booking.count({
      where: {
        guestId: userId,
        status: "APPROVED",
        checkOut: { lte: new Date() },
      },
    }),
  ]);
  const stays = completed + checkedOut;
  const plan = membershipForStays(stays);
  return {
    stays,
    ...plan,
    next: staysToNextLevel(stays),
  };
}

export type CustomerMembership = Awaited<
  ReturnType<typeof getCustomerMembership>
>;
