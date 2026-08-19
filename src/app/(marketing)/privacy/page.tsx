import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy",
  description:
    "How Your Home (yourhome.co.ke) collects, uses, and protects your personal information when you browse, list, or book property in Kenya.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: August 2026
      </p>

      <div className="prose prose-neutral mt-10 max-w-none dark:prose-invert">
        <p>
          Your Home (&quot;we&quot;, &quot;us&quot;, yourhome.co.ke) respects
          your privacy. This policy explains what information we collect and how
          we use it when you use our Kenya real estate marketplace.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>
            Account details such as name, email, and phone number when you
            register.
          </li>
          <li>
            Listing content, photos, and messages you submit as a seller, agent,
            or tenant.
          </li>
          <li>
            Usage data such as pages visited and device type, to improve the
            site and prevent abuse.
          </li>
        </ul>

        <h2>How we use your information</h2>
        <ul>
          <li>To operate listings, inquiries, bookings, and payments.</li>
          <li>To verify accounts and review listings before publication.</li>
          <li>To send service emails such as verification codes and booking updates.</li>
          <li>To improve search, security, and customer support.</li>
        </ul>

        <h2>Sharing</h2>
        <p>
          We do not sell your personal data. We share information only with
          service providers (hosting, email, payments) as needed to run the
          platform, or when required by law.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy:{" "}
          <a href="mailto:charlesnduya84@gmail.com">charlesnduya84@gmail.com</a>
        </p>
      </div>
    </div>
  );
}
