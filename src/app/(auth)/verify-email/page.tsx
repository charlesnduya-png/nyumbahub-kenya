"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { MailCheck } from "lucide-react";
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

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email")?.trim().toLowerCase() ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/^\d{6}$/.test(code.trim())) {
      toast.error("Enter your email and the 6-digit code");
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.trim() }),
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error ?? "Could not verify code");
        return;
      }
      toast.success("Email verified! You can sign in now.");
      router.push("/login?verified=1");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  }

  async function onResend() {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error ?? "Could not resend code");
        return;
      }
      if (result.alreadyVerified) {
        toast.success("Email already verified. You can sign in.");
        router.push("/login");
        return;
      }
      if (result.previewCode) {
        toast.message(`Dev code: ${result.previewCode}`);
      }
      toast.success(
        result.sent
          ? "A new code was sent to your email"
          : "Mail is not configured yet — ask admin to set Gmail App Password.",
      );
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <MailCheck className="h-7 w-7 text-primary" />
        </div>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          Enter the 6-digit code we sent to your inbox to activate your
          Your Home account.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onVerify}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Verification code</Label>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="tracking-[0.35em] text-center text-lg font-semibold"
            />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Didn&apos;t get it? Check spam, or resend a new code.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isVerifying}>
            {isVerifying ? "Verifying…" : "Verify email"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isResending}
            onClick={onResend}
          >
            {isResending ? "Sending…" : "Resend code"}
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Verify your email</CardTitle>
            <CardDescription>Loading…</CardDescription>
          </CardHeader>
        </Card>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
