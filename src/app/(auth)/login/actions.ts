"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  dashboardHomeForRole,
  isSiteOwnerEmail,
} from "@/lib/site-owner";

export type LoginActionResult =
  | { ok: true; redirectTo: string; isOwner: boolean }
  | { ok: false; error: string; needsVerification?: boolean };

export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<LoginActionResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const incomingPassword = String(password ?? "");

  if (!normalizedEmail || incomingPassword.length < 8) {
    return { ok: false, error: "Invalid email or password. Please try again." };
  }

  let redirectTo = "/dashboard/tenant";
  const isOwner = isSiteOwnerEmail(normalizedEmail);
  let role: string | undefined;

  if (!isOwner) {
    try {
      const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          role: true,
          emailVerified: true,
          passwordHash: true,
          isActive: true,
        },
      });

      if (!existing?.passwordHash || !existing.isActive) {
        return {
          ok: false,
          error: "Invalid email or password. Please try again.",
        };
      }

      role = existing.role;
      redirectTo = dashboardHomeForRole(existing.role, normalizedEmail);

      // Soft gate: only block when email was never verified AND a code is still pending.
      // Does not lock out older accounts that predate verification.
      if (!existing.emailVerified) {
        const pendingCode = await prisma.verificationToken.findFirst({
          where: {
            identifier: `email-verify:${normalizedEmail}`,
            expires: { gt: new Date() },
          },
          select: { identifier: true },
        });
        if (pendingCode) {
          return {
            ok: false,
            needsVerification: true,
            error:
              "Verify your email first. Enter the 6-digit code we sent you.",
          };
        }
      }
    } catch (error) {
      console.error("Login pre-check failed:", error);
      return {
        ok: false,
        error: "Unable to sign in right now. Please try again.",
      };
    }
  } else {
    redirectTo = "/dashboard/admin";
  }

  try {
    await signIn("credentials", {
      email: normalizedEmail,
      password: incomingPassword,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        ok: false,
        error: "Invalid email or password. Please try again.",
      };
    }

    const digest =
      typeof error === "object" &&
      error &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string"
        ? (error as { digest: string }).digest
        : "";

    // Auth.js throws NEXT_REDIRECT on success — rethrow so the browser follows it
    // and the session cookie is applied correctly.
    if (digest.startsWith("NEXT_REDIRECT")) {
      throw error;
    }

    console.error("Login action unexpected error:", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  // Fallback if signIn did not redirect (should be rare)
  return {
    ok: true,
    isOwner,
    redirectTo: isOwner
      ? "/dashboard/admin"
      : dashboardHomeForRole(role, normalizedEmail),
  };
}
