import Link from "next/link";
import { Globe, MessageCircle, Share2, Users } from "lucide-react";

import { BrandLogo } from "@/components/brand/logo";
import {
  AFRICA_COUNTRY_MARKETS_BY_SLUG,
  featuredAfricaCountrySlugs,
} from "@/lib/africa-markets";
import { APP_NAME } from "@/lib/seo";
import { CANONICAL_SITE_URL, PRIMARY_SITE_URL } from "@/lib/site-domains";
import {
  SEO_BUY_AREA_LANDINGS,
  SEO_COUNTY_LANDINGS,
  SEO_RENT_AREA_LANDINGS,
} from "@/lib/seo-locations";

const exploreLinks = [
  { href: "/property-for-sale", label: "Buy Property" },
  { href: "/rent", label: "Rent Property" },
  { href: "/bnb", label: "BnB & Holiday Homes" },
  { href: "/hotels", label: "Hotels" },
  { href: "/africa", label: "All African countries" },
  { href: "/properties?category=land-plots", label: "Land & Plots" },
  { href: "/agents", label: "Find an Agent" },
];

const popularSearchLinks = [
  ...SEO_COUNTY_LANDINGS.slice(0, 3),
  ...SEO_RENT_AREA_LANDINGS.slice(0, 2),
  ...SEO_BUY_AREA_LANDINGS.slice(0, 2),
].map(({ label, path }) => ({ href: path, label }));

const africaFooterLinks = featuredAfricaCountrySlugs()
  .slice(0, 8)
  .map((slug) => {
    const country = AFRICA_COUNTRY_MARKETS_BY_SLUG.get(slug);
    return country
      ? { href: `/property-for-sale/${country.slug}`, label: country.name }
      : null;
  })
  .filter((item): item is { href: string; label: string } => Boolean(item));

const sellerLinks = [
  { href: "/register/professional", label: "List Your Property" },
  { href: "/register", label: "Customer Signup" },
  { href: "/agents/join", label: "Become an Agent" },
];

const companyLinks = [
  { href: "/about", label: "About Us" },
  { href: "/blog", label: "Blog" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/cookies", label: "Cookie Policy" },
];

const socialLinks = [
  { href: "https://twitter.com", label: "Twitter / X", icon: Share2 },
  { href: "https://facebook.com", label: "Facebook", icon: Users },
  { href: "https://instagram.com", label: "Instagram", icon: MessageCircle },
  { href: "https://linkedin.com", label: "LinkedIn", icon: Globe },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-1">
            <BrandLogo showKenya size="lg" />
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Your Home is Africa&apos;s marketplace for verified homes, land,
              rentals, and BnB stays — starting in Kenya. We connect buyers,
              tenants, and hosts with trusted sellers and agents.
            </p>
            <div className="mt-4 flex gap-3">
              {socialLinks.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Explore
            </h3>
            <ul className="mt-4 space-y-2">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Popular places
            </h3>
            <ul className="mt-4 space-y-2">
              {popularSearchLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Across Africa
            </h3>
            <ul className="mt-4 space-y-2">
              {africaFooterLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/africa"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  All 54 countries
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Sellers
            </h3>
            <ul className="mt-4 space-y-2">
              {sellerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Company
            </h3>
            <ul className="mt-4 space-y-2">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Legal
            </h3>
            <ul className="mt-4 space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {year} {APP_NAME}. All rights reserved.{" "}
            <a
              href={PRIMARY_SITE_URL}
              className="hover:text-primary"
            >
              yourhome.co.ke
            </a>
            {" · "}
            <a href={CANONICAL_SITE_URL} className="hover:text-primary">
              www.yourhome.africa
            </a>
          </p>
          <p
            className="text-xs text-muted-foreground"
            aria-label="Accepted payment methods"
          >
            Payments:{" "}
            <span className="font-medium text-foreground">M-Pesa</span>
            {" · "}
            <span className="font-medium text-foreground">Visa</span>
            {" · "}
            <span className="font-medium text-foreground">Mastercard</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
