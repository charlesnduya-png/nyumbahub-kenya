"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useDisplayCurrency } from "@/components/currency/currency-provider";

function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termYears: number,
): number {
  if (principal <= 0 || termYears <= 0) return 0;
  if (annualRate <= 0) return principal / (termYears * 12);

  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  );
}

export function MortgageCalculator() {
  const [principal, setPrincipal] = React.useState(5000000);
  const [rate, setRate] = React.useState(13.5);
  const [term, setTerm] = React.useState(20);
  const { formatConvertedPrice, currency } = useDisplayCurrency();

  const monthlyPayment = calculateMonthlyPayment(principal, rate, term);
  const totalPayment = monthlyPayment * term * 12;
  const totalInterest = totalPayment - principal;

  return (
    <section className="py-16 sm:py-20" aria-labelledby="mortgage-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="mortgage-heading"
            className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Mortgage Calculator
          </h2>
          <p className="mt-2 text-muted-foreground">
            Estimate monthly payments — calculator uses KES loan amounts, shown in{" "}
            {currency}.
          </p>
        </div>

        <Card className="mx-auto mt-10 max-w-2xl rounded-2xl border-border shadow-lg">
          <CardHeader>
            <CardTitle className="font-display text-xl">
              Calculate your payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="principal">Loan amount (KES)</Label>
                <span className="text-sm font-medium text-primary">
                  {formatConvertedPrice(principal, "KES")}
                </span>
              </div>
              <Input
                id="principal"
                type="number"
                value={principal}
                onChange={(e) =>
                  setPrincipal(Math.max(0, Number(e.target.value) || 0))
                }
                min={0}
                step={100000}
                aria-describedby="principal-value"
              />
              <Slider
                value={[principal]}
                onValueChange={([v]) => setPrincipal(v)}
                min={500000}
                max={50000000}
                step={100000}
                aria-label="Loan amount slider"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="rate">Interest rate (% p.a.)</Label>
                <span className="text-sm font-medium text-primary">
                  {rate.toFixed(1)}%
                </span>
              </div>
              <Input
                id="rate"
                type="number"
                value={rate}
                onChange={(e) =>
                  setRate(
                    Math.max(0, Math.min(30, Number(e.target.value) || 0)),
                  )
                }
                min={0}
                max={30}
                step={0.1}
              />
              <Slider
                value={[rate]}
                onValueChange={([v]) => setRate(v)}
                min={5}
                max={25}
                step={0.5}
                aria-label="Interest rate slider"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="term">Loan term (years)</Label>
                <span className="text-sm font-medium text-primary">
                  {term} years
                </span>
              </div>
              <Input
                id="term"
                type="number"
                value={term}
                onChange={(e) =>
                  setTerm(
                    Math.max(1, Math.min(30, Number(e.target.value) || 1)),
                  )
                }
                min={1}
                max={30}
              />
              <Slider
                value={[term]}
                onValueChange={([v]) => setTerm(v)}
                min={5}
                max={30}
                step={1}
                aria-label="Loan term slider"
              />
            </div>

            <div
              className="rounded-2xl bg-primary/5 p-6 text-center"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <p className="text-sm text-muted-foreground">
                Estimated monthly payment
              </p>
              <p className="font-display mt-1 text-4xl font-semibold text-primary">
                {formatConvertedPrice(Math.round(monthlyPayment), "KES")}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total interest</p>
                  <p className="font-medium">
                    {formatConvertedPrice(Math.round(totalInterest), "KES")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total repayment</p>
                  <p className="font-medium">
                    {formatConvertedPrice(Math.round(totalPayment), "KES")}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Estimates only. Actual rates vary by lender. Consult a financial
              advisor before making decisions.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
