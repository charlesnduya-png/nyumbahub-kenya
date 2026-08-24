import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const checkDb = new URL(request.url).searchParams.get("db") === "1";

  if (!checkDb) {
    return NextResponse.json({
      ok: true,
      service: "your-home",
      timestamp: new Date().toISOString(),
    });
  }

  const { prisma } = await import("@/lib/prisma");
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
      service: "your-home",
      database,
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}
