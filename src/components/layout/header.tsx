"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  GitCompareArrows,
  Heart,
  LayoutDashboard,
  Menu,
  Palmtree,
  Hotel,
  User,
  type LucideIcon,
} from "lucide-react";
import * as React from "react";

import { BrandLogo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { dashboardHomeForRole } from "@/lib/site-owner";
import { cn } from "@/lib/utils";

const navLinks: {
  href: string;
  label: string;
  icon?: LucideIcon;
}[] = [
  { href: "/property-for-sale", label: "Buy" },
  { href: "/rent", label: "Rent" },
  { href: "/bnb", label: "BnB", icon: Palmtree },
  { href: "/hotels", label: "Hotels", icon: Hotel },
  { href: "/africa", label: "Africa" },
  { href: "/properties?category=land-plots", label: "Land" },
  { href: "/properties?listingType=COMMERCIAL", label: "Commercial" },
  { href: "/agents", label: "Agents" },
];

export function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = React.useState(false);

  const isLoggedIn = status === "authenticated" && Boolean(session?.user);
  const dashboardHref = dashboardHomeForRole(
    session?.user?.role,
    session?.user?.email,
  );
  const firstName =
    session?.user?.name?.split(" ")[0] ??
    session?.user?.email?.split("@")[0] ??
    "Account";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4 lg:gap-8">
          <BrandLogo size="sm" className="min-w-0 shrink sm:hidden" />
          <BrandLogo size="md" className="hidden shrink-0 sm:inline-flex" />

          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isBnb = link.href === "/bnb";
              const isHotel = link.href === "/hotels";
              const isBuy = link.href === "/property-for-sale";
              const active =
                pathname === link.href ||
                (isBnb && pathname.startsWith("/bnb")) ||
                (isHotel && pathname.startsWith("/hotels")) ||
                (isBuy && pathname.startsWith("/property-for-sale"));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "group inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                    active && "bg-accent/60 text-foreground",
                    isBnb &&
                      "font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200",
                    isHotel &&
                      "font-semibold text-primary hover:text-primary",
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

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="hidden rounded-full lg:inline-flex"
            asChild
          >
            <Link href="/compare" aria-label="Compare properties">
              <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden rounded-full lg:inline-flex"
            asChild
          >
            <Link href="/wishlist" aria-label="Wishlist">
              <Heart className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>

          {isLoggedIn ? <NotificationBell /> : null}

          <ThemeToggle />

          {/* Desktop auth / account — only with full nav (lg+) to avoid crowding */}
          <div className="hidden items-center gap-2 lg:flex">
            {status === "loading" ? (
              <div className="h-8 w-28 animate-pulse rounded-md bg-muted" />
            ) : isLoggedIn ? (
              <Button size="sm" asChild>
                <Link href={dashboardHref}>
                  <LayoutDashboard className="mr-1.5 h-4 w-4" />
                  {firstName}
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/register">Join free</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register/professional">List property</Link>
                </Button>
              </>
            )}
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
            <SheetContent side="right" className="w-[min(100vw,24rem)]">
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
                      className="group inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      {Icon ? (
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            link.href === "/bnb"
                              ? "animate-bnb-icon text-teal-600 dark:text-teal-400"
                              : "text-primary",
                          )}
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
                {isLoggedIn ? (
                  <Button asChild>
                    <Link href={dashboardHref} onClick={() => setOpen(false)}>
                      <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                      My dashboard
                    </Link>
                  </Button>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
