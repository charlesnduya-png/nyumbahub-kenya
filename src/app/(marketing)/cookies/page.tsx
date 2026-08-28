import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Cookie Policy",
  description:
    "How Your Home (yourhome.co.ke and yourhome.africa) uses cookies and similar technologies on our real estate website.",
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        Cookie Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: August 2026
      </p>

      <div className="prose prose-neutral mt-10 max-w-none dark:prose-invert">
        <p>
          Your Home uses cookies and similar storage to keep you signed in,
          remember preferences, and understand how visitors use
          yourhome.co.ke and yourhome.africa.
        </p>

        <h2>Types of cookies we use</h2>
        <ul>
          <li>
            <strong>Essential</strong> — session and authentication cookies
            required to log in and use your dashboard.
          </li>
          <li>
            <strong>Functional</strong> — saved searches, wishlist, and UI
            preferences.
          </li>
          <li>
            <strong>Analytics</strong> — anonymous visit counts to improve
            performance and content (where enabled).
          </li>
        </ul>

        <h2>Managing cookies</h2>
        <p>
          You can block or delete cookies in your browser settings. Disabling
          essential cookies may prevent you from signing in or submitting
          listings.
        </p>

        <h2>Contact</h2>
        <p>
          <a href="mailto:charlesnduya84@gmail.com">charlesnduya84@gmail.com</a>
        </p>
      </div>
    </div>
  );
}
