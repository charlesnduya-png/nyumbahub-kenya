import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listAllPayments } from "@/lib/payments-store";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "Admin access required" },
      { status: 403 },
    );
  }

  return NextResponse.json({
    success: true,
    data: listAllPayments(),
  });
}
