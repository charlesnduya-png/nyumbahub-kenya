"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  HandCoins,
  Flag,
  KeyRound,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  CalendarDays,
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
  Hotel,
  Activity,
  UserCircle,
  BadgeCheck,
  Wallet,
  Banknote,
  BadgePercent,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";
import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { SITE_OWNER_COOKIE } from "@/lib/site-owner";
import {
  TEAM_ROLE_LABEL,
  canAccessNavHref,
  type TeamNavState,
  type TeamRoleValue,
} from "@/lib/team-roles";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const jobPartnerNav: NavItem[] = [
  { label: "Partner home", href: "/dashboard/jobs", icon: Briefcase },
  { label: "Wallet", href: "/dashboard/jobs/wallet", icon: Banknote },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
];

const professionalNav: NavItem[] = [
  { label: "Professional Home", href: "/dashboard/pro", icon: Briefcase },
  { label: "Profile photo", href: "/dashboard/pro/profile", icon: UserCircle },
  { label: "Promote", href: "/dashboard/seller/promote", icon: Megaphone },
  { label: "The team", href: "/dashboard/pro/team", icon: Users },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Inbox", href: "/dashboard/pro/inbox", icon: Inbox },
  { label: "All Listings", href: "/dashboard/pro/listings", icon: Building2 },
  { label: "Hotels", href: "/dashboard/pro/hotels", icon: Hotel },
  { label: "Boma yangu", href: "/dashboard/pro/plots", icon: Home },
  { label: "Rent management", href: "/dashboard/pro/rent", icon: Wallet },
  { label: "Wallet", href: "/dashboard/pro/wallet", icon: Banknote },
  { label: "BnB bookings", href: "/dashboard/pro/bookings", icon: Calendar },
  { label: "Inquiries", href: "/dashboard/pro/inquiries", icon: MessageSquare },
  { label: "Viewings", href: "/dashboard/pro/viewings", icon: CalendarDays },
  { label: "Offers", href: "/dashboard/pro/offers", icon: HandCoins },
  { label: "Rental reservations", href: "/dashboard/pro/rental-reservations", icon: KeyRound },
  { label: "Add Property", href: "/dashboard/seller/properties/new", icon: Home },
  { label: "Views & Analytics", href: "/dashboard/seller/analytics", icon: BarChart3 },
];

const agentExtraNav: NavItem[] = [
  { label: "Clients", href: "/dashboard/agent/clients", icon: Users },
  { label: "CRM", href: "/dashboard/agent/crm", icon: ClipboardList },
  { label: "Subscription", href: "/dashboard/agent/subscription", icon: CreditCard },
];

const adminNav: NavItem[] = [
  { label: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Site traffic", href: "/dashboard/admin/traffic", icon: Activity },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Accounts", href: "/dashboard/admin/users", icon: Users },
  { label: "Teams", href: "/dashboard/admin/teams", icon: Users },
  { label: "Tenants", href: "/dashboard/admin/users?tab=tenants", icon: UserRound },
  { label: "Agents", href: "/dashboard/admin/users?tab=agents", icon: UserCheck },
  { label: "Landlords", href: "/dashboard/admin/users?tab=landlords", icon: Users },
  { label: "Admins", href: "/dashboard/admin/users?tab=admins", icon: Shield },
  { label: "Properties", href: "/dashboard/admin/properties", icon: Building2 },
  { label: "Hotels", href: "/dashboard/admin/hotels", icon: Hotel },
  { label: "Reported accounts", href: "/dashboard/admin/reported-accounts", icon: Flag },
  { label: "Rental reservations", href: "/dashboard/admin/rental-reservations", icon: KeyRound },
  { label: "Republish requests", href: "/dashboard/admin/rental-republish-requests", icon: KeyRound },
  { label: "Verify accounts", href: "/dashboard/admin/verification", icon: BadgeCheck },
  { label: "Payments", href: "/dashboard/admin/payments", icon: CreditCard },
  { label: "Wallets", href: "/dashboard/admin/wallets", icon: Banknote },
  { label: "Subscriptions", href: "/dashboard/admin/subscriptions", icon: FileText },
  { label: "Ads", href: "/dashboard/admin/ads", icon: Megaphone },
  { label: "Blog", href: "/dashboard/admin/blog", icon: FileText },
  { label: "Listing Approvals", href: "/dashboard/admin/moderation", icon: Shield },
  { label: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
];

const buyerNav: NavItem[] = [
  { label: "Tenant Home", href: "/dashboard/tenant", icon: UserRound },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Messages", href: "/dashboard/tenant/messages", icon: Inbox },
  { label: "My offers", href: "/dashboard/tenant/offers", icon: HandCoins },
  { label: "Rental reservations", href: "/dashboard/tenant/rental-reservations", icon: KeyRound },
  { label: "Saved Homes", href: "/dashboard/tenant/saved", icon: Heart },
  { label: "Membership", href: "/dashboard/tenant/membership", icon: BadgePercent },
  { label: "My Bookings", href: "/dashboard/tenant/bookings", icon: Palmtree },
  { label: "My reviews", href: "/dashboard/tenant/reviews", icon: Star },
  { label: "My Viewings", href: "/dashboard/tenant/viewings", icon: Calendar },
  { label: "Recently Viewed", href: "/dashboard/tenant/recent", icon: Clock3 },
  { label: "Browse Rentals", href: "/rent", icon: Building2 },
  { label: "Browse BnBs", href: "/bnb", icon: Palmtree },
  { label: "Browse hotels", href: "/hotels", icon: Hotel },
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
    case "JOB_PARTNER":
      return jobPartnerNav;
    default:
      return buyerNav;
  }
}

interface DashboardSidebarProps {
  role: Role;
  userName?: string | null;
  team?: TeamNavState | null;
  onNavigate?: () => void;
  className?: string;
}

export function DashboardSidebar({
  role,
  userName,
  team,
  onNavigate,
  className,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const navItems = getNavForRole(role).filter((item) =>
    canAccessNavHref(item.href, team),
  );
  const isPro = role === "SELLER" || role === "AGENT";
  const isJobPartner = role === "JOB_PARTNER";
  const roleLabels = (team?.roles ?? [])
    .map((roleKey: TeamRoleValue) => TEAM_ROLE_LABEL[roleKey] ?? roleKey)
    .join(" · ");

  return (
    <aside
      className={cn(
        "flex h-full w-full max-w-xs flex-col border-r bg-card lg:w-64 lg:max-w-none",
        className,
      )}
    >
      <div className="p-5 sm:p-6">
        <BrandLogo size="sm" />
        {userName ? (
          <p className="mt-2 truncate text-sm text-muted-foreground">
            {userName}
          </p>
        ) : null}
        <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">
          {role === "ADMIN"
            ? "Site owner admin"
            : team?.isTeamMember
              ? `On ${team.ownerName}'s team`
              : isJobPartner
                ? "Job partner"
                : isPro
                  ? "Professional admin"
                  : "Tenant account"}
        </p>
        {team?.isTeamMember && roleLabels ? (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {roleLabels}
          </p>
        ) : null}
      </div>
      <Separator />
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard/pro" &&
                item.href !== "/dashboard/jobs" &&
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
                onClick={onNavigate}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
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
                {item.badge ? (
                  <Badge
                    variant={active ? "secondary" : "outline"}
                    className="h-5 min-w-5 justify-center px-1.5 text-[10px]"
                  >
                    {item.badge}
                  </Badge>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <Separator />
      <div className="space-y-2 p-4">
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/properties" onClick={onNavigate}>
            <Building2 className="mr-2 h-4 w-4" />
            Marketplace
          </Link>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={() => {
            document.cookie = `${SITE_OWNER_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
            void signOut({ callbackUrl: "/login" });
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
