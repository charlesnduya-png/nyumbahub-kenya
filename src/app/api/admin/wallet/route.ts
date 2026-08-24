import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAdminWalletRankings,
  getAdminWalletTransactions,
  getAdminWithdrawals,
  recordWalletPayout,
  reviewWalletWithdrawal,
  backfillRecentWalletActivity,
} from "@/lib/wallet";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "Admin access required" },
      { status: 403 },
    );
  }

  try {
    const existingTx = await prisma.walletTransaction.count();
    if (existingTx === 0) {
      await backfillRecentWalletActivity(prisma);
    }
    const [rankings, earnings, withdrawals] = await Promise.all([
      getAdminWalletRankings(prisma),
      getAdminWalletTransactions(prisma, 150),
      getAdminWithdrawals(prisma, 150),
    ]);

    return NextResponse.json({
      success: true,
      data: { rankings, earnings, withdrawals },
    });
  } catch (error) {
    console.error("Admin wallet load failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load professional wallets" },
      { status: 500 },
    );
  }
}

const payoutSchema = z.object({
  userId: z.string().min(1),
  amount: z.coerce.number().positive(),
  note: z.string().trim().max(300).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "Admin access required" },
      { status: 403 },
    );
  }

  const parsed = payoutSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Enter a professional and a payout amount" },
      { status: 400 },
    );
  }

  try {
    const payout = await recordWalletPayout(prisma, parsed.data);
    return NextResponse.json({ success: true, data: { id: payout.id } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to record payout";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

const reviewSchema = z.object({
  withdrawalId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  note: z.string().trim().max(300).optional(),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "Admin access required" },
      { status: 403 },
    );
  }

  const parsed = reviewSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Select a withdrawal to approve or reject" },
      { status: 400 },
    );
  }

  try {
    const result = await reviewWalletWithdrawal(prisma, parsed.data);
    try {
      await prisma.notification.create({
        data: {
          userId: result.userId,
          type: "PAYMENT",
          title:
            parsed.data.action === "approve"
              ? "Withdrawal paid"
              : "Withdrawal rejected",
          body:
            parsed.data.action === "approve"
              ? "Your wallet withdrawal was marked as paid."
              : "Your wallet withdrawal was rejected and the money was returned to your balance.",
          link: "/dashboard/pro/wallet",
        },
      });
    } catch (error) {
      console.error("Notify professional of withdrawal review failed:", error);
    }
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to review withdrawal";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
