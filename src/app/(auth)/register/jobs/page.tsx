"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { Briefcase, Building2, IdCard, UserRound } from "lucide-react";
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
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export default function JobPartnerRegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema) as Resolver<RegisterInput>,
    defaultValues: { role: "JOB_PARTNER", nationalId: "" },
  });

  async function onSubmit(data: RegisterInput) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, role: "JOB_PARTNER" }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error ?? "Registration failed");
        return;
      }

      toast.success(
        result.otpSent
          ? "Account created! Check your email for the verification code."
          : "Account created! Verify your email to continue.",
      );
      router.push(
        `/verify-email?email=${encodeURIComponent(data.email.trim().toLowerCase())}`,
      );
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl bg-white p-3 shadow-sm sm:grid-cols-3">
        <Link
          href="/register"
          className="rounded-xl border border-slate-200 bg-white p-4 text-slate-900 transition hover:border-primary/50 hover:bg-slate-50"
        >
          <div className="mb-2 flex items-center gap-2">
            <UserRound className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Customer</span>
          </div>
          <p className="text-xs text-slate-600">Browse and save homes.</p>
        </Link>
        <Link
          href="/register/professional"
          className="rounded-xl border border-slate-200 bg-white p-4 text-slate-900 transition hover:border-primary/50 hover:bg-slate-50"
        >
          <div className="mb-2 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Professional</span>
          </div>
          <p className="text-xs text-slate-600">List properties and hotels.</p>
        </Link>
        <div className="rounded-xl border-2 border-primary bg-primary/10 p-4 text-slate-900">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Briefcase className="h-4 w-4" />
            <span className="text-sm font-semibold">Job partner</span>
          </div>
          <p className="text-xs text-slate-600">
            Earn 30% when hotels you refer pay their plan.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle>Create a job partner account</CardTitle>
          <CardDescription>
            Get a personal referral link, track hotels you onboard, and earn
            30% commission on their monthly hotel plan payments.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="rounded-xl border bg-muted/40 p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">How it works</p>
              <ol className="mt-2 list-inside list-decimal space-y-1">
                <li>Share your link with hotel operators</li>
                <li>They create a professional account and subscribe to a plan</li>
                <li>You earn 30% every month they pay — tracked in your wallet</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full legal name</Label>
              <Input
                id="name"
                placeholder="As on your National ID"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="0712345678" {...register("phone")} />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <IdCard className="h-4 w-4 text-primary" />
                National ID (required)
              </div>
              <Input
                id="nationalId"
                placeholder="e.g. 12345678"
                {...register("nationalId")}
              />
              {errors.nationalId && (
                <p className="text-sm text-destructive">
                  {errors.nationalId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account…" : "Create job partner account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Want to list properties instead?{" "}
              <Link
                href="/register/professional"
                className="text-primary hover:underline"
              >
                Open a professional account
              </Link>
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
