import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Hotel, Share2, Wallet } from "lucide-react";

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
    question: "How can I make money on Your Home?",
    answer:
      `You can earn as a job partner (${pct}% commission when agencies and hotels you refer pay monthly plans), list property for sale or rent, host BnB stays, or run an agency account with paid listing plans.`,
  },
  {
    question: "What is the Your Home job partner program?",
    answer:
      `Job partners share a personal referral link with estate agencies, agents, landlords, and hotel operators. When they subscribe to a paid agency or hotel plan, you earn ${pct}% commission in your wallet — including on renewals.`,
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
  title: "Earn Money on Your Home — Partner Program & Referrals Kenya",
  description: `Make money with Your Home: earn ${pct}% commission referring agencies and hotels, list property for sale or rent, or host BnB stays across Kenya and Africa. Free to join as a job partner.`,
  path: "/partners",
  keywords: [
    "earn money real estate Kenya",
    "real estate referral commission Kenya",
    "job partner Your Home",
    "affiliate real estate Africa",
    "make money referring agents Kenya",
    "hotel plan referral commission",
    "agency referral program Kenya",
    "earn from Your Home",
    "yourhome.co.ke partners",
    "list property earn Kenya",
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
            name: "Earn money with Your Home partner program",
            description: `Job partners earn ${pct}% commission on paid agency and hotel plans. Landlords and hosts also earn by listing on Your Home.`,
            url: absoluteUrl("/partners"),
            about: {
              "@type": "Thing",
              name: "Real estate referral partner program",
            },
          }),
        }}
      />

      <section className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <BrandLogo showKenya size="lg" className="mb-8" />
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Earn with Your Home
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Turn Africa&apos;s property market into income — refer agencies and
            hotels for {pct}% commission, list homes and land, or host BnB stays
            on Your Home.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/register/jobs">
                Become a job partner
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
            Share your referral link with estate agencies, agents, landlords,
            and hotel operators across Kenya and Africa. When they pay a monthly
            agency or hotel plan on Your Home, you earn {pct}% — paid into your
            wallet as soon as their payment clears, and again every month they
            renew.
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
                  <Link href="/pricing" className="text-primary underline-offset-4 hover:underline">
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
            <li className="flex gap-4">
              <Wallet className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-medium">Grow an agency or hotel business</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Agency and hotel plans unlock more listings, team tools, and
                  visibility — and job partners earn commission when those plans
                  are paid via a referral link.
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
            Join free as a job partner or open a professional listing account.
            Payments use M-Pesa where available.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/register/jobs">Join as job partner</Link>
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
