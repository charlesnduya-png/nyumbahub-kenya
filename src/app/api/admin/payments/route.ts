import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "Admin access required" },
      { status: 403 },
    );
  }

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { email: true } } },
  });

  return NextResponse.json({
    success: true,
    data: payments.map((p) => {
      const metadata =
        (p.metadata as unknown as Record<string, unknown>) ?? {};
      const productId = metadata["productId"];

      return {
      id: p.id,
      reference: p.reference ?? p.id,
      productName:
        p.description ?? (productId ? String(productId) : undefined) ?? "Your Home payment",
      amount: p.amount,
      status: p.status,
      method: p.method,
      userEmail: p.user?.email ?? null,
      createdAt: p.createdAt.toISOString(),
      };
    }),
  });
}
