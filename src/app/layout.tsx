import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";
import { APP_NAME, APP_URL } from "@/lib/seo";

import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} — Find Your Perfect Home in Kenya`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "Discover verified homes, land, and commercial properties across Kenya. Buy, rent, or list with trusted agents on NyumbaHub Kenya.",
  keywords: [
    "Kenya real estate",
    "property for sale Kenya",
    "rentals Nairobi",
    "land for sale Kenya",
    "NyumbaHub",
  ],
  openGraph: {
    type: "website",
    locale: "en_KE",
    siteName: APP_NAME,
    title: `${APP_NAME} — Find Your Perfect Home in Kenya`,
    description:
      "Discover verified homes, land, and commercial properties across Kenya.",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description:
      "Discover verified homes, land, and commercial properties across Kenya.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${fraunces.variable} font-sans antialiased`}
      >
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
