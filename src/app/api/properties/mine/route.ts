import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOwnerListings } from "@/lib/properties";
import { resolveProfessionalActingContext } from "@/lib/account-team";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const ctx = await resolveProfessionalActingContext(session.user.id);
    const canView =
      ctx.permissions.manageListings ||
      (ctx.isTeamMember && ctx.teamMemberRole === "READ");

    if (!canView) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const data = await getOwnerListings(ctx.actingOwnerId);

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load your listings" },
      { status: 500 },
    );
  }
}
