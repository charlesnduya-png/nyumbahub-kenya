import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  let database: "up" | "down" = "down";

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "up";
  } catch {
    database = "down";
  }

  const ok = database === "up";

  return NextResponse.json(
    {
      ok,
      service: "nyumbahub",
      database,
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}
