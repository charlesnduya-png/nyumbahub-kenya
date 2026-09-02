"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm, type Resolver } from "react-hook-form";
import { BadgeCheck, Briefcase, Building2, IdCard, UserRound } from "lucide-react";
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
import { RegisterAccountTypePicker } from "@/components/auth/register-account-type-picker";
import { jobPartnerCommissionPercent } from "@/lib/job-partner-copy";
import { addHotelPath, isProfessionalRole } from "@/lib/hotel-listing";
import { KENYA_COUNTIES } from "@/lib/kenya";

import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export default function ProfessionalRegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobRefFromUrl = searchParams.get("jobRef")?.trim() ?? "";
  const pct = jobPartnerCommissionPercent();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    if (!isProfessionalRole(session.user.role)) return;
    router.replace(addHotelPath());
  }, [status, session, router]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema) as Resolver<RegisterInput>,
    defaultValues: {
      role: "SELLER",
      county: "Nairobi",
      nationalId: "",
      agencyName: "",
      jobRef: jobRefFromUrl || undefined,
    },
  });

  useEffect(() => {
    if (jobRefFromUrl) {
      setValue("jobRef", jobRefFromUrl, { shouldValidate: false });
    }
  }, [jobRefFromUrl, setValue]);

  const role = watch("role");
  const county = watch("county");

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

  if (status === "authenticated" && isProfessionalRole(session?.user?.role)) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        You are already signed in. Opening add hotel…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <RegisterAccountTypePicker
        options={[
          {
            href: "/register",
            icon: UserRound,
            label: "Customer",
            description: "Browse and save homes only.",
          },
          {
            active: true,
            icon: Building2,
            label: "Professional",
            description:
              "List houses for sale or rent after ID verification and admin approval.",
          },
          {
            href: "/register/jobs",
            icon: Briefcase,
            label: "Job partner",
            description: `Earn ${pct}% by referring agencies and hotels.`,
          },
        ]}
      />

      <Card>
        <CardHeader className="text-center">
          <CardTitle>Create a professional account</CardTitle>
          <CardDescription>
            For landlords, owners, and agents — free for now (up to 5 listings).
            Official ID details are required and reviewed by Your Home admin.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="rounded-xl border bg-muted/40 p-3 text-sm text-muted-foreground">
              <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
                <BadgeCheck className="h-4 w-4 text-primary" />
                How listing works
              </div>
              Free professional account → Submit up to 5 properties → Admin
              approves each listing → Goes live.
            </div>

            {jobRefFromUrl ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                Referred by job partner{" "}
                <span className="font-mono font-semibold">{jobRefFromUrl}</span>.
                They earn {pct}% when you pay a monthly agency or hotel plan.
                <input type="hidden" {...register("jobRef")} />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Account type</Label>
              <Select
                value={role}
                onValueChange={(value) =>
                  setValue("role", value as RegisterInput["role"], {
                    shouldValidate: true,
                  })
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

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <IdCard className="h-4 w-4 text-primary" />
                Official identity (required)
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationalId">National ID / Passport number</Label>
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
                <p className="text-xs text-muted-foreground">
                  Used for verification only. Shown to admin on your agent /
                  landlord account.
                </p>
              </div>

              {role === "AGENT" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="agencyName">Agency / company name</Label>
                    <Input
                      id="agencyName"
                      placeholder="e.g. Greenview Homes Ltd"
                      {...register("agencyName")}
                    />
                    {errors.agencyName && (
                      <p className="text-sm text-destructive">
                        {errors.agencyName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Primary county</Label>
                    <Select
                      value={county ?? "Nairobi"}
                      onValueChange={(value) =>
                        setValue("county", value, { shouldValidate: true })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select county" />
                      </SelectTrigger>
                      <SelectContent>
                        {KENYA_COUNTIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : null}
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
            {status === "authenticated" ? (
              <p className="text-center text-sm text-muted-foreground">
                Signed in as {session?.user?.email}. This form is only for a
                new professional account.
              </p>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(addHotelPath())}`}
                  className="text-primary hover:underline"
                >
                  Sign in to list a hotel
                </Link>
              </p>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
