"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { BadgeCheck, Building2, UserRound } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export default function ProfessionalRegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema) as Resolver<RegisterInput>,
    defaultValues: { role: "SELLER" },
  });

  const role = watch("role");

  async function onSubmit(data: RegisterInput) {
    if (data.role !== "SELLER" && data.role !== "AGENT") {
      toast.error("Choose Seller or Agent for a professional account");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error ?? "Registration failed");
        return;
      }

      toast.success(
        "Professional account created! Sign in to submit listings for admin approval.",
      );
      router.push("/login?registered=professional");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/register"
          className="rounded-2xl border p-4 transition hover:border-primary/40 hover:bg-muted/40"
        >
          <div className="mb-2 flex items-center gap-2">
            <UserRound className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Customer</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Browse and save homes only.
          </p>
        </Link>
        <div className="rounded-2xl border border-primary bg-primary/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Building2 className="h-4 w-4" />
            <span className="text-sm font-semibold">Professional</span>
          </div>
          <p className="text-xs text-muted-foreground">
            List houses for sale or rent after admin approval.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle>Create a professional account</CardTitle>
          <CardDescription>
            For landlords, owners, and agents who want to list properties on
            NyumbaHub.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="rounded-xl border bg-muted/40 p-3 text-sm text-muted-foreground">
              <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
                <BadgeCheck className="h-4 w-4 text-primary" />
                How listing works
              </div>
              Submit your property → Admin reviews it → Once approved, it goes
              live on the marketplace.
            </div>

            <div className="space-y-2">
              <Label>Account type</Label>
              <Select
                value={role}
                onValueChange={(value) =>
                  setValue("role", value as RegisterInput["role"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select professional type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SELLER">
                    Property owner / landlord
                  </SelectItem>
                  <SelectItem value="AGENT">Licensed estate agent</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full name / agency contact</Label>
              <Input id="name" placeholder="David Ochieng" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@agency.co.ke"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Business phone</Label>
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
              {isLoading
                ? "Creating professional account…"
                : "Create professional account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Only looking to buy or rent?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Create a customer account
              </Link>
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Already registered?{" "}
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
