import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import {
  getAdminJobPartnersList,
  getAdminJobPartnerSummary,
  getAdminReferredHotelsList,
} from "@/lib/job-partner";
import { isSiteOwnerEmail } from "@/lib/site-owner";
import { getAdminWithdrawals } from "@/lib/wallet";
import { prisma } from "@/lib/prisma";

function isAdmin(session: Session | null) {
  return (
    Boolean(session?.user?.id) &&
    (session?.user?.role === "ADMIN" ||
      isSiteOwnerEmail(session?.user?.email))
  );
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json(
      { success: false, error: "Admin access required" },
      { status: 403 },
    );
  }

  try {
    const [summary, partners, referredHotels, allWithdrawals] = await Promise.all([
      getAdminJobPartnerSummary(),
      getAdminJobPartnersList(),
      getAdminReferredHotelsList(),
      getAdminWithdrawals(prisma, 200),
    ]);

    const withdrawals = allWithdrawals.filter(
      (row) => row.userRole === "JOB_PARTNER",
    );

    const commissions = await prisma.walletTransaction.findMany({
      where: {
        type: "HOTEL_RECRUITMENT",
        user: { role: "JOB_PARTNER" },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        summary,
        partners,
        referredHotels,
        withdrawals,
        commissions: commissions.map((row) => ({
          id: row.id,
          amount: row.amount,
          grossAmount: row.grossAmount,
          currency: row.currency,
          status: row.status,
          description: row.description,
          createdAt: row.createdAt.toISOString(),
          partnerUserId: row.user.id,
          partnerName: row.user.name,
          partnerEmail: row.user.email,
        })),
      },
    });
  } catch (error) {
    console.error("Admin job partners load failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load job partners" },
      { status: 500 },
    );
  }
}
