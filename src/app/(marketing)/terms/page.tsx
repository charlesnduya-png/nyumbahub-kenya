import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Terms of Service",
  description:
    "Terms of use for Your Home (yourhome.co.ke) — Kenya's marketplace for property listings, rentals, and BnB stays.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: August 2026
      </p>

      <div className="prose prose-neutral mt-10 max-w-none dark:prose-invert">
        <p>
          By using Your Home (yourhome.co.ke), you agree to these terms. If you
          do not agree, please do not use the platform.
        </p>

        <h2>Use of the platform</h2>
        <p>
          Your Home connects buyers, tenants, sellers, agents, and landlords in
          Kenya. You must provide accurate information and comply with Kenyan
          law when listing or transacting on property.
        </p>

        <h2>Listings and accounts</h2>
        <ul>
          <li>Listings may be reviewed before going live.</li>
          <li>
            We may remove content that is misleading, unlawful, or harmful.
          </li>
          <li>
            Professional accounts require verification; admin may suspend
            accounts that breach these terms.
          </li>
        </ul>

        <h2>Payments</h2>
        <p>
          Subscription and listing fees processed via M-Pesa or card are
          subject to the relevant payment provider&apos;s terms. Refunds are
          handled case by case according to our support policy.
        </p>

        <h2>Disclaimer</h2>
        <p>
          Your Home is a marketplace, not a party to property sales or rental
          agreements. Users are responsible for due diligence, title checks, and
          legal advice before completing transactions.
        </p>

        <h2>Contact</h2>
        <p>
          <a href="mailto:charlesnduya84@gmail.com">charlesnduya84@gmail.com</a>
        </p>
      </div>
    </div>
  );
}
