import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SITE_VISIT_RETENTION_DAYS } from "@/lib/site-visit-retention";

/**
 * Delete old SiteVisit rows to keep Neon storage / scan costs down.
 * Vercel cron: daily (see vercel.json). Secured with CRON_SECRET when set.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const cutoff = new Date(
    Date.now() - SITE_VISIT_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );

  try {
    const result = await prisma.siteVisit.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      olderThanDays: SITE_VISIT_RETENTION_DAYS,
      cutoff: cutoff.toISOString(),
    });
  } catch (error) {
    console.error("prune-site-visits failed:", error);
    return NextResponse.json(
      { success: false, error: "Prune failed" },
      { status: 500 },
    );
  }
}
