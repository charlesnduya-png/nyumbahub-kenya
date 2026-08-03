import type { NextAuthConfig } from "next-auth";
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
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
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig;
