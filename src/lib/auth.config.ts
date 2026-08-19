import type { NextAuthConfig } from "next-auth";
import { isSiteOwnerEmail } from "@/lib/site-owner";
import { safeSessionImage } from "@/lib/session-image";
import type { Role } from "@/types";

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
    signOut: "/logout",
    error: "/login",
    newUser: "/register",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
        token.picture = safeSessionImage(user.image);
      }

      if (trigger === "update" && session?.user) {
        if (session.user.name !== undefined) {
          token.name = session.user.name;
        }
        if (session.user.image !== undefined) {
          token.picture = safeSessionImage(session.user.image);
        }
      }

      if (isSiteOwnerEmail(token.email as string | undefined)) {
        token.role = "ADMIN";
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email =
          (token.email as string | undefined) ?? session.user.email;
        session.user.name =
          (token.name as string | undefined) ?? session.user.name;
        session.user.image =
          (token.picture as string | undefined) ?? session.user.image;
        session.user.role = (
          isSiteOwnerEmail(session.user.email) ? "ADMIN" : token.role
        ) as Role;
      }

      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const pathname = nextUrl.pathname;

      const protectedPrefixes = [
        "/dashboard",
        "/account",
        "/properties/new",
        "/properties/edit",
        "/messages",
        "/favorites",
      ];

      const isProtectedRoute = protectedPrefixes.some(
        (prefix) =>
          pathname === prefix || pathname.startsWith(`${prefix}/`),
      );

      if (isProtectedRoute && !isLoggedIn) {
        return false;
      }

      const authRoutes = ["/login", "/register"];
      const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

      if (isAuthRoute && isLoggedIn) {
        const email = auth?.user?.email;
        const role = auth?.user?.role;
        const dest =
          isSiteOwnerEmail(email) || role === "ADMIN"
            ? "/dashboard/admin"
            : "/dashboard";
        return Response.redirect(new URL(dest, nextUrl));
      }

      return true;
    },
  },
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig;
