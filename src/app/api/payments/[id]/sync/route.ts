import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { syncPaymentStatus } from "@/lib/payment-sync";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Sign in required" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const result = await syncPaymentStatus(id, session.user.id);

    if (!result.success) {
      return NextResponse.json(result, {
        status: result.error === "Forbidden" ? 403 : 404,
      });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to sync payment" },
      { status: 500 },
    );
  }
}
