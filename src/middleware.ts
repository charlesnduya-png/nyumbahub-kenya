import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  dashboardHomeForRole,
  isSiteOwnerEmail,
  SITE_OWNER_COOKIE,
  SITE_OWNER_EMAIL,
} from "@/lib/site-owner";

async function readToken(request: NextRequest, isSecure: boolean) {
  const secret = process.env.AUTH_SECRET;
  const names = isSecure
    ? ["__Secure-authjs.session-token", "__Secure-next-auth.session-token"]
    : ["authjs.session-token", "next-auth.session-token"];

  for (const cookieName of names) {
    const token = await getToken({
      req: request,
      secret,
      secureCookie: isSecure,
      cookieName,
    });
    if (token) return token;
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const isSecure = request.nextUrl.protocol === "https:";
  const token = await readToken(request, isSecure);
  const ownerCookie = request.cookies.get(SITE_OWNER_COOKIE)?.value === "1";

  // Not signed in → login (keep the page they asked for)
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    const callback = `${pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set("callbackUrl", callback);
    if (pathname.startsWith("/dashboard/admin")) {
      loginUrl.searchParams.set("owner", "1");
    }
    return NextResponse.redirect(loginUrl);
  }

  const email = String(
    token.email ??
      (token as { user?: { email?: string } }).user?.email ??
      "",
  ).toLowerCase();

  const isOwner =
    isSiteOwnerEmail(email) ||
    ownerCookie ||
    email === SITE_OWNER_EMAIL;

  const role = isOwner ? "ADMIN" : String(token.role ?? "BUYER");

  // /dashboard/admin is OWNER ONLY.
  // If a seller/agent opens it, send them to LOGIN — never to /dashboard/pro.
  if (pathname.startsWith("/dashboard/admin")) {
    if (!isOwner && role !== "ADMIN") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", "/dashboard/admin");
      loginUrl.searchParams.set("owner", "1");
      loginUrl.searchParams.set("error", "owner-required");
      const res = NextResponse.redirect(loginUrl);
      // Drop stale owner cookie if a non-owner somehow had it
      res.cookies.set(SITE_OWNER_COOKIE, "", { path: "/", maxAge: 0 });
      return res;
    }

    const res = NextResponse.next();
    res.cookies.set(SITE_OWNER_COOKIE, "1", {
      path: "/",
      sameSite: "lax",
      secure: isSecure,
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  }

  // Owner must never stay on pro/tenant/seller/agent — except Add hotel/property
  if (isOwner || role === "ADMIN") {
    if (pathname.startsWith("/dashboard/seller/properties/new")) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/dashboard/admin", request.url));
  }

  const home = dashboardHomeForRole(role, email);

  // Invitees keep a BUYER JWT until the session refreshes. The pro/seller
  // layouts check real team membership so they can still open the workspace.
  if (pathname.startsWith("/dashboard/tenant") && role !== "BUYER") {
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (pathname.startsWith("/dashboard/jobs") && role !== "JOB_PARTNER") {
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (
    pathname.startsWith("/dashboard/pro") &&
    role === "JOB_PARTNER"
  ) {
    return NextResponse.redirect(new URL("/dashboard/jobs", request.url));
  }

  if (
    pathname.startsWith("/dashboard/agent") &&
    role !== "AGENT"
  ) {
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
