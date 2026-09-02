"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { Briefcase, Building2, IdCard, UserRound } from "lucide-react";
import { RegisterAccountTypePicker } from "@/components/auth/register-account-type-picker";
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
import { JobPartnerEarningsInfo } from "@/components/job-partner/job-partner-earnings-info";
import { jobPartnerCommissionPercent } from "@/lib/job-partner-copy";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

const AUTH_FORM_FOOTER =
  "sticky bottom-0 z-10 flex flex-col gap-4 border-t bg-card/95 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm";

export default function JobPartnerRegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const pct = jobPartnerCommissionPercent();

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
      <RegisterAccountTypePicker
        options={[
          {
            href: "/register",
            icon: UserRound,
            label: "Customer",
            description: "Browse and save homes.",
          },
          {
            href: "/register/professional",
            icon: Building2,
            label: "Professional",
            description: "List properties and hotels.",
          },
          {
            active: true,
            icon: Briefcase,
            label: "Job partner",
            description: `Earn ${pct}% when agencies or hotels you refer pay their plan.`,
          },
        ]}
      />

      <Card>
        <CardHeader className="text-center">
          <CardTitle>Create a job partner account</CardTitle>
          <CardDescription>
            Refer estate agencies and hotel operators. Earn {pct}% on every
            monthly agency or hotel plan payment — credited to your wallet right
            away.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="rounded-xl border bg-muted/40 p-4">
              <JobPartnerEarningsInfo />
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
          <CardFooter className={AUTH_FORM_FOOTER}>
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
