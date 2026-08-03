"use client";

import Link from "next/link";
import { useState } from "react";
import { Smartphone } from "lucide-react";
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

export default function VerifyPhonePage() {
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);

  function handleSendOtp() {
    setSent(true);
  }

  function handleVerify() {
    // Stub — wire to SMS provider in production
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Smartphone className="h-7 w-7 text-primary" />
        </div>
        <CardTitle>Verify your phone number</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to your Safaricom or Airtel line. Phone
          verification helps agents and buyers reach you quickly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!sent ? (
          <Button onClick={handleSendOtp} className="w-full">
            Send OTP via SMS
          </Button>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="otp">One-time password</Label>
            <Input
              id="otp"
              placeholder="123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="text-center text-lg tracking-widest"
            />
            <Button
              onClick={handleVerify}
              className="w-full"
              disabled={otp.length !== 6}
            >
              Verify phone
            </Button>
            <button
              type="button"
              onClick={handleSendOtp}
              className="w-full text-sm text-primary hover:underline"
            >
              Resend code
            </button>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="ghost" className="w-full">
          <Link href="/dashboard">Skip for now</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
