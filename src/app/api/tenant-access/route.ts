import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  TENANT_ACCESS_HOURS,
  TENANT_ACCESS_PRICE,
  TENANT_ACCESS_PRODUCT_ID,
} from "@/lib/pricing";
import {
  activateTenantAccess,
  getActiveTenantAccess,
  roleNeedsTenantAccessPass,
} from "@/lib/tenant-access";

const activateSchema = z.object({
  paymentId: z.string().min(1).optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Sign in required" },
        { status: 401 },
      );
    }

    const needsPass = roleNeedsTenantAccessPass(session.user.role);
    if (!needsPass) {
      return NextResponse.json({
        success: true,
        data: {
          required: false,
          active: true,
          productId: TENANT_ACCESS_PRODUCT_ID,
          price: TENANT_ACCESS_PRICE,
          hours: TENANT_ACCESS_HOURS,
          endsAt: null,
        },
      });
    }

    const pass = await getActiveTenantAccess(session.user.id);
    return NextResponse.json({
      success: true,
      data: {
        required: true,
        active: Boolean(pass),
        productId: TENANT_ACCESS_PRODUCT_ID,
        price: TENANT_ACCESS_PRICE,
        hours: TENANT_ACCESS_HOURS,
        endsAt: pass?.endDate?.toISOString() ?? null,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load viewing pass" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Sign in required" },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = activateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 },
      );
    }

    const pass = await activateTenantAccess({
      userId: session.user.id,
      paymentId: parsed.data.paymentId,
    });

    return NextResponse.json({
      success: true,
      data: {
        active: true,
        endsAt: pass.endDate?.toISOString() ?? null,
        productId: TENANT_ACCESS_PRODUCT_ID,
        price: TENANT_ACCESS_PRICE,
        hours: TENANT_ACCESS_HOURS,
      },
      message: `Viewing pass active for ${TENANT_ACCESS_HOURS} hours`,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to activate viewing pass" },
      { status: 500 },
    );
  }
}
