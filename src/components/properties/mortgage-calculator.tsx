"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

export function MortgageCalculator({ propertyPrice }: { propertyPrice: number }) {
  const [deposit, setDeposit] = useState(Math.round(propertyPrice * 0.2));
  const [rate, setRate] = useState(13);
  const [years, setYears] = useState(20);

  const loanAmount = Math.max(propertyPrice - deposit, 0);
  const monthlyRate = rate / 100 / 12;
  const months = years * 12;

  const monthlyPayment =
    monthlyRate === 0
      ? loanAmount / months
      : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1);

  const totalRepayment = monthlyPayment * months;
  const totalInterest = totalRepayment - loanAmount;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Mortgage calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Deposit (KES)</Label>
            <Input
              type="number"
              value={deposit}
              onChange={(e) => setDeposit(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Interest rate (% p.a.)</Label>
            <Input
              type="number"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Term (years)</Label>
            <Input
              type="number"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Loan amount</span>
            <span className="font-medium">{formatPrice(loanAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Monthly payment</span>
            <span className="text-lg font-bold text-primary">
              {formatPrice(Math.round(monthlyPayment))}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total interest</span>
            <span>{formatPrice(Math.round(totalInterest))}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Estimates only. Actual rates vary by bank (KCB, Equity, Co-op, NCBA, etc.).
        </p>
      </CardContent>
    </Card>
  );
}
