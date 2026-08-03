"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  Heart,
  Home,
  Inbox,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquare,
  Shield,
  Users,
  UserCheck,
  ClipboardList,
  Briefcase,
  Clock3,
  UserRound,
  Palmtree,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";
import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const professionalNav: NavItem[] = [
  { label: "Admin Home", href: "/dashboard/pro", icon: Briefcase },
  { label: "Inbox", href: "/dashboard/pro/inbox", icon: Inbox, badge: "2" },
  { label: "All Listings", href: "/dashboard/pro/listings", icon: Building2 },
  { label: "Inquiries", href: "/dashboard/pro/inquiries", icon: MessageSquare, badge: "2" },
  { label: "Add Property", href: "/dashboard/seller/properties/new", icon: Home },
  { label: "Promote", href: "/dashboard/seller/promote", icon: Megaphone },
  { label: "Views & Analytics", href: "/dashboard/seller/analytics", icon: BarChart3 },
];

const agentExtraNav: NavItem[] = [
  { label: "Clients", href: "/dashboard/agent/clients", icon: Users },
  { label: "CRM", href: "/dashboard/agent/crm", icon: ClipboardList },
  { label: "Viewings", href: "/dashboard/agent/viewings", icon: Calendar },
  { label: "Subscription", href: "/dashboard/agent/subscription", icon: CreditCard },
];

const adminNav: NavItem[] = [
  { label: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Users", href: "/dashboard/admin/users", icon: Users },
  { label: "Properties", href: "/dashboard/admin/properties", icon: Building2 },
  { label: "Agents", href: "/dashboard/admin/agents", icon: UserCheck },
  { label: "Payments", href: "/dashboard/admin/payments", icon: CreditCard },
  { label: "Subscriptions", href: "/dashboard/admin/subscriptions", icon: FileText },
  { label: "Ads", href: "/dashboard/admin/ads", icon: Megaphone },
  { label: "Blog", href: "/dashboard/admin/blog", icon: FileText },
  { label: "Listing Approvals", href: "/dashboard/admin/moderation", icon: Shield },
  { label: "Verification", href: "/dashboard/admin/verification", icon: UserCheck },
  { label: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
];

const buyerNav: NavItem[] = [
  { label: "Tenant Home", href: "/dashboard/tenant", icon: UserRound },
  { label: "Saved Homes", href: "/dashboard/tenant/saved", icon: Heart },
  { label: "My Inquiries", href: "/dashboard/tenant/inquiries", icon: MessageSquare },
  { label: "My Viewings", href: "/dashboard/tenant/viewings", icon: Calendar },
  { label: "Recently Viewed", href: "/dashboard/tenant/recent", icon: Clock3 },
  { label: "Browse Rentals", href: "/rent", icon: Building2 },
  { label: "Browse BnBs", href: "/bnb", icon: Palmtree },
  { label: "Compare", href: "/compare", icon: LayoutDashboard },
];

function getNavForRole(role: Role): NavItem[] {
  switch (role) {
    case "SELLER":
      return professionalNav;
    case "AGENT":
      return [...professionalNav, ...agentExtraNav];
    case "ADMIN":
      return adminNav;
    default:
      return buyerNav;
  }
}

interface DashboardSidebarProps {
  role: Role;
  userName?: string | null;
}

export function DashboardSidebar({ role, userName }: DashboardSidebarProps) {
  const pathname = usePathname();
  const navItems = getNavForRole(role);
  const isPro = role === "SELLER" || role === "AGENT";

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      <div className="p-6">
        <BrandLogo size="sm" />
        {userName && (
          <p className="mt-2 truncate text-sm text-muted-foreground">
            {userName}
          </p>
        )}
        <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">
          {isPro
            ? "Professional admin"
            : role === "BUYER"
              ? "Tenant account"
              : `${role.toLowerCase()} dashboard`}
        </p>
      </div>
      <Separator />
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard/pro" &&
                item.href !== "/dashboard/agent" &&
                item.href !== "/dashboard/admin" &&
                item.href !== "/dashboard/seller" &&
                item.href !== "/dashboard/tenant" &&
                !item.href.includes("?") &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    item.href === "/bnb" && "animate-bnb-icon",
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <Badge
                    variant={active ? "secondary" : "outline"}
                    className="h-5 min-w-5 justify-center px-1.5 text-[10px]"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <Separator />
      <div className="space-y-2 p-4">
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/properties">
            <Building2 className="mr-2 h-4 w-4" />
            Marketplace
          </Link>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
