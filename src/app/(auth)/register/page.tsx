"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { Building2, Briefcase, UserRound } from "lucide-react";
import { RegisterAccountTypePicker } from "@/components/auth/register-account-type-picker";
import { jobPartnerCommissionPercent } from "@/lib/job-partner-copy";
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

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const pct = jobPartnerCommissionPercent();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema) as Resolver<RegisterInput>,
    defaultValues: { role: "BUYER" },
  });

  async function onSubmit(data: RegisterInput) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, role: "BUYER" }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error ?? "Registration failed");
        return;
      }

      toast.success(
        result.otpSent
          ? "Account created! Check your email for the verification code."
          : "Account created! Enter the verification code we sent (or request a new one).",
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
            active: true,
            icon: UserRound,
            label: "Customer",
            description: "Browse, save homes, and contact sellers.",
          },
          {
            href: "/register/professional",
            icon: Building2,
            label: "Professional",
            description: "List properties for sale or rent (admin approval required).",
          },
          {
            href: "/register/jobs",
            icon: Briefcase,
            label: "Job partner",
            description: `Earn ${pct}% when agencies or hotels you refer pay their plan.`,
          },
        ]}
      />

      <Card>
        <CardHeader className="text-center">
          <CardTitle>Create a customer account</CardTitle>
          <CardDescription>
            Free account to search homes, save favourites, and message listings.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" placeholder="Jane Wanjiru" {...register("name")} />
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
              <Label htmlFor="phone">Phone (Safaricom/Airtel)</Label>
              <Input
                id="phone"
                placeholder="0712345678"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
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
              {isLoading ? "Creating account…" : "Create customer account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Want to list a house?{" "}
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
