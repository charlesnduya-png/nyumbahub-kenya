import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveProfessionalActingContext } from "@/lib/account-team";
import { prisma } from "@/lib/prisma";
import { getWalletOverview } from "@/lib/wallet";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Sign in required" },
      { status: 401 },
    );
  }

  try {
    const ctx = await resolveProfessionalActingContext(session.user.id);
    const isOwner = !ctx.isTeamMember;
    const canView =
      isOwner ||
      ctx.permissions.manageTeam ||
      ctx.permissions.manageBookings ||
      ctx.permissions.manageListings;

    if (!canView) {
      return NextResponse.json(
        { success: false, error: "Wallet access required" },
        { status: 403 },
      );
    }

    const data = await getWalletOverview(prisma, ctx.actingOwnerId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Load wallet failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load wallet" },
      { status: 500 },
    );
  }
}
