import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isCrawlerUserAgent } from "@/lib/crawler";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "nyumba_sid";
const SKIP_PREFIXES = ["/api", "/dashboard", "/_next", "/favicon", "/sitemap"];

export async function POST(request: Request) {
  try {
    if (isCrawlerUserAgent(request.headers.get("user-agent"))) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const body = await request.json().catch(() => ({}));
    const path =
      typeof body.path === "string" ? body.path.trim().slice(0, 500) : "/";

    if (
      SKIP_PREFIXES.some((p) => path.startsWith(p)) ||
      path.includes(".")
    ) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const cookieStore = await cookies();
    let sessionId =
      cookieStore.get(SESSION_COOKIE)?.value ??
      (typeof body.sessionId === "string" ? body.sessionId : null);

    if (!sessionId || sessionId.length < 8) {
      sessionId = crypto.randomUUID();
    }

    const referrer =
      typeof body.referrer === "string"
        ? body.referrer.trim().slice(0, 500)
        : null;

    await prisma.siteVisit.create({
      data: {
        sessionId,
        path,
        referrer: referrer || null,
      },
    });

    const res = NextResponse.json({ success: true });
    res.cookies.set(SESSION_COOKIE, sessionId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
