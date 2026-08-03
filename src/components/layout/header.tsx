"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GitCompareArrows,
  Heart,
  Menu,
  Palmtree,
  User,
  type LucideIcon,
} from "lucide-react";
import * as React from "react";

import { BrandLogo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navLinks: {
  href: string;
  label: string;
  icon?: LucideIcon;
}[] = [
  { href: "/properties?listingType=BUY", label: "Buy" },
  { href: "/rent", label: "Rent" },
  { href: "/bnb", label: "BnB", icon: Palmtree },
  { href: "/properties?listingType=LAND", label: "Land" },
  { href: "/properties?listingType=COMMERCIAL", label: "Commercial" },
  { href: "/agents", label: "Agents" },
  { href: "/pricing", label: "Pricing" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <BrandLogo size="md" />

          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isBnb = link.href === "/bnb";
              const active =
                pathname === link.href ||
                (isBnb && pathname.startsWith("/bnb"));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "group inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                    active && "bg-accent/60 text-foreground",
                    isBnb &&
                      "font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200",
                  )}
                >
                  {Icon ? (
                    <Icon
                      className={cn(
                        "h-4 w-4 text-teal-600 dark:text-teal-400",
                        isBnb && "animate-bnb-icon",
                      )}
                      aria-hidden="true"
                    />
                  ) : null}
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="hidden rounded-full sm:inline-flex"
            asChild
          >
            <Link href="/compare" aria-label="Compare properties">
              <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden rounded-full sm:inline-flex"
            asChild
          >
            <Link href="/wishlist" aria-label="Wishlist">
              <Heart className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>

          <ThemeToggle />

          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/register">Join free</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register/professional">List your property</Link>
            </Button>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-sm">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <BrandLogo href={null} showKenya size="sm" />
                </SheetTitle>
              </SheetHeader>
              <nav
                className="mt-8 flex flex-col gap-1"
                aria-label="Mobile navigation"
              >
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="group inline-flex items-center gap-2 rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      {Icon ? (
                        <Icon
                          className="animate-bnb-icon h-4 w-4 text-teal-600 dark:text-teal-400"
                          aria-hidden="true"
                        />
                      ) : null}
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-6 flex flex-col gap-3 border-t pt-6">
                <Button variant="outline" asChild>
                  <Link href="/compare" onClick={() => setOpen(false)}>
                    <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
                    Compare
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/wishlist" onClick={() => setOpen(false)}>
                    <Heart className="h-4 w-4" aria-hidden="true" />
                    Wishlist
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    <User className="h-4 w-4" aria-hidden="true" />
                    Sign in
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/register" onClick={() => setOpen(false)}>
                    Customer account
                  </Link>
                </Button>
                <Button asChild>
                  <Link
                    href="/register/professional"
                    onClick={() => setOpen(false)}
                  >
                    List your property
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
