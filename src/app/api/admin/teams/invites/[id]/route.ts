import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSiteOwnerEmail } from "@/lib/site-owner";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(_: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const isAdmin =
      Boolean(session?.user?.id) &&
      (session?.user?.role === "ADMIN" ||
        isSiteOwnerEmail(session?.user?.email));
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const invite = await prisma.accountTeamInvite.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!invite) {
      return NextResponse.json(
        { success: false, error: "Invitation not found" },
        { status: 404 },
      );
    }

    await prisma.accountTeamInvite.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin delete team invite failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to cancel invitation" },
      { status: 500 },
    );
  }
}
