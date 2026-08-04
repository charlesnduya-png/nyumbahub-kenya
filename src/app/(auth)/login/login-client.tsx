"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
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
import { DEMO_PASSWORD } from "@/lib/demo-users";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

const QUICK_LOGINS = [
  { label: "Admin", email: "admin@nyumbahub.co.ke", href: "/dashboard/admin" },
  { label: "Seller", email: "seller@nyumbahub.co.ke", href: "/dashboard/pro" },
  { label: "Agent", email: "agent@nyumbahub.co.ke", href: "/dashboard/pro" },
  { label: "Tenant", email: "buyer@nyumbahub.co.ke", href: "/dashboard/tenant" },
] as const;

export default function LoginPageClient() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function loginWith(
    email: string,
    password: string,
    nextUrl = callbackUrl,
  ) {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result?.ok || result.error) {
        toast.error("Invalid email or password. Please try again.");
        return;
      }

      toast.success("Welcome back!");
      // Full navigation so the session cookie is sent on the next request.
      window.location.assign(nextUrl);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmit(data: LoginInput) {
    const roleHint = QUICK_LOGINS.find(
      (q) => q.email.toLowerCase() === data.email.toLowerCase(),
    );
    await loginWith(
      data.email,
      data.password,
      roleHint?.href ?? callbackUrl,
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Sign in to NyumbaHub</CardTitle>
        <CardDescription>
          Find homes across Kenya — from Nairobi to the coast.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="rounded-xl border bg-muted/50 p-3 text-left text-xs text-muted-foreground">
            <p className="mb-2 font-medium text-foreground">Demo logins</p>
            <p className="mb-2">
              Password for all: <code className="text-foreground">{DEMO_PASSWORD}</code>
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_LOGINS.map((q) => (
                <Button
                  key={q.email}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isLoading}
                  onClick={() => {
                    setValue("email", q.email);
                    setValue("password", DEMO_PASSWORD);
                    void loginWith(q.email, DEMO_PASSWORD, q.href);
                  }}
                >
                  {q.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@nyumbahub.co.ke"
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
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in…" : "Sign in"}
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
