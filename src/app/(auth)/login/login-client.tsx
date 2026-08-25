"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeCallbackPath } from "@/lib/hotel-listing";
import {
  SITE_OWNER_COOKIE,
  dashboardHomeForRole,
  isSiteOwnerEmail,
} from "@/lib/site-owner";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

function setOwnerCookie(enabled: boolean) {
  if (typeof document === "undefined") return;
  if (enabled) {
    document.cookie = `${SITE_OWNER_COOKIE}=1; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  } else {
    document.cookie = `${SITE_OWNER_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}

export default function LoginPageClient() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const ownerMode =
    searchParams.get("owner") === "1" ||
    Boolean(callbackUrl?.includes("/dashboard/admin"));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    const requested = safeCallbackPath(callbackUrl);
    const allowAdmin =
      isSiteOwnerEmail(session.user.email) || session.user.role === "ADMIN";
    const dest =
      requested &&
      (allowAdmin || !requested.startsWith("/dashboard/admin"))
        ? requested
        : dashboardHomeForRole(session.user.role, session.user.email);
    router.replace(dest);
  }, [status, session, callbackUrl, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (searchParams.get("error") === "owner-required") {
      toast.error("Only the site owner can open the admin dashboard.");
    }
    if (searchParams.get("verified") === "1") {
      toast.success("Email verified. You can sign in now.");
    }
  }, [searchParams]);

  async function loginWith(email: string, password: string) {
    setIsLoading(true);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      // Pre-check verification + role via API so client signIn can set cookies reliably
      const pre = await fetch("/api/auth/login-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      const preJson = await pre.json();

      if (!pre.ok || !preJson.success) {
        toast.error(preJson.error ?? "Invalid email or password.");
        if (preJson.needsVerification) {
          window.location.href = `/verify-email?email=${encodeURIComponent(normalizedEmail)}`;
        }
        return;
      }

      const result = await signIn("credentials", {
        email: normalizedEmail,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        const message =
          result?.error === "CredentialsSignin"
            ? "Invalid email or password. Please try again."
            : result?.error
              ? `Sign in failed: ${result.error}`
              : "Sign in failed. Please try again.";
        toast.error(message);
        return;
      }

      if (result.ok === false) {
        toast.error("Sign in failed. Please try again.");
        return;
      }

      const isOwner = Boolean(preJson.isOwner) || isSiteOwnerEmail(normalizedEmail);

      if (isOwner) {
        setOwnerCookie(true);
        toast.success("Welcome, site owner");
      } else if (ownerMode) {
        toast.error("Only the site owner can open the admin dashboard.");
        setOwnerCookie(false);
        return;
      } else {
        setOwnerCookie(false);
        toast.success("Welcome back!");
      }

      const dest =
        (typeof callbackUrl === "string" &&
        callbackUrl.startsWith("/") &&
        !callbackUrl.startsWith("//") &&
        (isOwner || !callbackUrl.startsWith("/dashboard/admin"))
          ? callbackUrl
          : null) ??
        (preJson.redirectTo as string | undefined) ??
        dashboardHomeForRole(preJson.role, normalizedEmail);

      window.location.replace(dest);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (status === "authenticated") {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>You are already signed in</CardTitle>
          <CardDescription>Opening your account…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>
          {ownerMode ? "Site owner admin login" : "Sign in to Your Home"}
        </CardTitle>
        <CardDescription>
          {ownerMode
            ? "Sign in with your owner account to manage the whole site."
            : "Find homes across Kenya — from Nairobi to the coast."}
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={handleSubmit((data) => loginWith(data.email, data.password))}
      >
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? "Signing in…"
              : ownerMode
                ? "Sign in to Admin"
                : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Register free
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
