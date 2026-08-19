import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSiteOwnerEmail } from "@/lib/site-owner";
import {
  getTrafficAnalytics,
  parseTrafficRange,
} from "@/lib/site-analytics";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const isAdmin =
      session?.user?.role === "ADMIN" ||
      isSiteOwnerEmail(session?.user?.email);

    if (!session?.user?.id || !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const range = parseTrafficRange(searchParams.get("range"));
    const data = await getTrafficAnalytics(prisma, range);

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load traffic analytics" },
      { status: 500 },
    );
  }
}
