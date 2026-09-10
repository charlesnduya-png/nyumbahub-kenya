import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Building2,
  Globe2,
  Hotel,
  Share2,
  Wallet,
} from "lucide-react";

import { BrandLogo } from "@/components/brand/logo";
import { JobPartnerEarningsInfo } from "@/components/job-partner/job-partner-earnings-info";
import { Button } from "@/components/ui/button";
import {
  JOB_PARTNER_EARNINGS,
  jobPartnerCommissionPercent,
} from "@/lib/job-partner-copy";
import {
  absoluteUrl,
  buildPageMetadata,
  faqPageJsonLd,
} from "@/lib/seo";

const pct = jobPartnerCommissionPercent();

const PARTNER_FAQ = [
  {
    question: "Can people from other countries become job partners?",
    answer:
      "Yes. Your Home job partners can join from Kenya, across Africa, and other countries worldwide. Share your referral link with agencies and hotels anywhere Your Home operates, then withdraw earnings via PayPal, Wise, bank transfer, or local mobile money.",
  },
  {
    question: "How can I make money on Your Home?",
    answer: `Register free as a job partner and earn ${pct}% commission when agencies and hotels you refer pay monthly plans. You can also list property for sale or rent, or host BnB stays. Start at /register/jobs.`,
  },
  {
    question: "What is the Your Home job partner / affiliate program?",
    answer: `Job partners share a personal referral link with estate agencies, agents, landlords, and hotel operators. When they subscribe to a paid agency or hotel plan, you earn ${pct}% in your wallet — including on renewals.`,
  },
  {
    question: "How do job partner payouts and currency work?",
    answer: JOB_PARTNER_EARNINGS.currency,
  },
  {
    question: "Which payout methods are supported?",
    answer: JOB_PARTNER_EARNINGS.payouts,
  },
  {
    question: "When do job partners get paid?",
    answer: JOB_PARTNER_EARNINGS.when,
  },
  {
    question: "Do commissions continue every month?",
    answer: JOB_PARTNER_EARNINGS.recurring,
  },
  {
    question: "Can landlords and BnB hosts earn on Your Home?",
    answer:
      "Yes. Sellers and landlords list homes, land, and rentals. BnB hosts earn from confirmed stays (Your Home takes a platform fee on bookings). Start with a free professional account, then upgrade if you need more listings.",
  },
] as const;

export const metadata: Metadata = buildPageMetadata({
  title: `Earn ${pct}% Online — Your Home Job Partner Program Worldwide`,
  description: `Register free and earn ${pct}% referring real estate agencies and hotels on Your Home. Open to partners in Kenya, Africa, and other countries. Withdraw with PayPal, Wise, bank transfer, or mobile money.`,
  path: "/partners",
  keywords: [
    "earn money online real estate Africa",
    "real estate affiliate program",
    "job partner Your Home",
    "referral commission PayPal",
    "make money referring agents",
    "hotel plan referral commission",
    "agency referral program Africa",
    "earn from Your Home",
    "yourhome.co.ke partners",
    "yourhome.africa partners",
    "international real estate affiliate",
    "PayPal real estate referral payout",
    "Wise payout affiliate Kenya",
    "register job partner earn commission",
    "diaspora earn real estate Africa",
  ],
});

export const revalidate = 3600;

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqPageJsonLd([...PARTNER_FAQ])),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Earn money worldwide with the Your Home partner program",
            description: `Job partners worldwide earn ${pct}% commission on paid agency and hotel plans. Withdraw via PayPal, Wise, bank, or mobile money.`,
            url: absoluteUrl("/partners"),
            about: {
              "@type": "Thing",
              name: "International real estate referral partner program",
            },
          }),
        }}
      />

      <section className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <BrandLogo size="lg" className="mb-8" />
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Earn with Your Home — worldwide
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Join free from any country. Refer agencies and hotels for {pct}%{" "}
            commission, then cash out with PayPal, Wise, bank transfer, or
            mobile money.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/register/jobs">
                Register free to earn
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/register/professional">List your property</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-12 px-4 py-14 sm:px-6 lg:px-8">
        <div>
          <h2 className="font-display text-2xl font-semibold">
            Job partner program — {pct}% commission
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {JOB_PARTNER_EARNINGS.international} Share your referral link with
            estate agencies, agents, landlords, and hotel operators. When they
            pay a monthly plan on Your Home, you earn {pct}% — credited to your
            wallet as soon as payment clears, and again every month they renew.
          </p>
          <div className="mt-6 rounded-xl border bg-card p-5">
            <JobPartnerEarningsInfo />
          </div>
          <div className="mt-6">
            <Button asChild>
              <Link href="/register/jobs">
                Create free partner account
                <Share2 className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>

        <div>
          <h2 className="font-display text-2xl font-semibold">
            Currency & payout methods
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {JOB_PARTNER_EARNINGS.currency}
          </p>
          <ul className="mt-6 space-y-4">
            <li className="flex gap-4">
              <Globe2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-medium">Worldwide partners welcome</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Sign up from Kenya, Nigeria, Ghana, South Africa, the UK, US,
                  UAE, India, Europe, and more. Refer professionals wherever
                  Your Home listings grow.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <Banknote className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-medium">PayPal, Wise & more</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {JOB_PARTNER_EARNINGS.payouts}
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <Wallet className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-medium">Wallet currency</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Your dashboard shows balances in your wallet currency. Digital
                  wallets and banks typically convert to USD, EUR, GBP, or your
                  local currency when the payout is sent.
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-2xl font-semibold">
            Other ways to earn on Your Home
          </h2>
          <ul className="mt-6 space-y-6">
            <li className="flex gap-4">
              <Building2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-medium">List property for sale or rent</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Sellers, landlords, and agents publish verified listings.
                  Start with free listings, then upgrade when you need more
                  inventory.{" "}
                  <Link
                    href="/pricing"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    See pricing
                  </Link>
                  .
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <Hotel className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-medium">Host BnB stays and hotels</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Earn from short stays and hotel bookings. Guests pay your
                  nightly rate; Your Home takes a platform fee on confirmed
                  stays.
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-2xl font-semibold">
            Frequently asked questions
          </h2>
          <dl className="mt-6 space-y-6">
            {PARTNER_FAQ.map((item) => (
              <div key={item.question}>
                <dt className="font-medium">{item.question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="border-t pt-10">
          <h2 className="font-display text-2xl font-semibold">
            Ready to start earning?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Free registration. Worldwide partners. PayPal and Wise supported.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/register/jobs">Register as job partner</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/register/professional">List property</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/about">About Your Home</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
