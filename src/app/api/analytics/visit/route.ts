import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isCrawlerUserAgent } from "@/lib/crawler";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { ttlGet, ttlSet } from "@/lib/ttl-cache";

const SESSION_COOKIE = "nyumba_sid";
const SKIP_PREFIXES = [
  "/api",
  "/dashboard",
  "/_next",
  "/favicon",
  "/sitemap",
  "/partners",
  "/about",
  "/privacy",
  "/terms",
  "/cookies",
  "/login",
  "/register",
];
const DEDUPE_MS = 30 * 60 * 1000;

function dedupeKey(sessionId: string, path: string) {
  return `visit:${sessionId}:${path}`;
}

function setSessionCookie(res: NextResponse, sessionId: string) {
  res.cookies.set(SESSION_COOKIE, sessionId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function POST(request: Request) {
  try {
    if (isCrawlerUserAgent(request.headers.get("user-agent"))) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const ip = clientIp(request);
    const ipLimit = rateLimit({
      key: `visit:ip:${ip}`,
      limit: 12,
      windowMs: 60_000,
    });
    if (!ipLimit.ok) {
      return tooManyRequests(ipLimit.retryAfterSec);
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

    const sessionLimit = rateLimit({
      key: `visit:sid:${sessionId}`,
      limit: 8,
      windowMs: 60 * 60 * 1000,
    });
    if (!sessionLimit.ok) {
      const res = NextResponse.json({ success: true, skipped: true });
      setSessionCookie(res, sessionId);
      return res;
    }

    // Memory dedupe — skip Neon entirely for repeats in this isolate.
    if (ttlGet<true>(dedupeKey(sessionId, path))) {
      const res = NextResponse.json({ success: true, skipped: true });
      setSessionCookie(res, sessionId);
      return res;
    }

    // Mark before write so concurrent requests in this isolate don't double-insert.
    ttlSet(dedupeKey(sessionId, path), true, DEDUPE_MS);

    const referrer =
      typeof body.referrer === "string"
        ? body.referrer.trim().slice(0, 500)
        : null;

    // Skip findFirst (extra read per pageview). Client sampling + rate limits
    // keep volume low; rare cross-isolate dupes are acceptable for traffic stats.
    await prisma.siteVisit.create({
      data: {
        sessionId,
        path,
        referrer: referrer || null,
      },
    });

    const res = NextResponse.json({ success: true });
    setSessionCookie(res, sessionId);
    return res;
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
