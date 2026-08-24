import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";
import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_URL,
  GOOGLE_SITE_VERIFICATION,
  SEO_KEYWORDS,
  absoluteUrl,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0b6e4f",
};

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl("/")),
  title: {
    default: `${APP_NAME} — Africa Real Estate | Houses, Rent, Land & BnB`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  authors: [{ name: APP_NAME, url: APP_URL }],
  creator: APP_NAME,
  publisher: APP_NAME,
  category: "real estate",
  keywords: SEO_KEYWORDS,
  ...(GOOGLE_SITE_VERIFICATION
    ? { verification: { google: GOOGLE_SITE_VERIFICATION } }
    : {}),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: absoluteUrl("/"),
    siteName: APP_NAME,
    title: `${APP_NAME} — Africa Real Estate | Houses, Rent, Land & BnB`,
    description: APP_DESCRIPTION,
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: `${APP_NAME} — Africa real estate, rentals & BnB`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Africa Real Estate | Houses, Rent, Land & BnB`,
    description: APP_DESCRIPTION,
    images: [absoluteUrl("/opengraph-image")],
  },
  icons: {
    icon: "/favicon.ico",
  },
  other: {
    "geo.region": "AF",
    "geo.placename": "Africa",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = [organizationJsonLd(), websiteJsonLd()];

  return (
    <html lang="en-KE" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body
        className={`${dmSans.variable} ${fraunces.variable} font-sans antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
