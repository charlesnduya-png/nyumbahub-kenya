import type { LucideIcon } from "lucide-react";
import {
  BadgePercent,
  Briefcase,
  CalendarRange,
  ClipboardList,
  Trophy,
  Users,
} from "lucide-react";

export type HotelServiceCategoryKey =
  | "GROUP_BOOKING"
  | "EVENT_CONFERENCE"
  | "EVENT_BOOKING_REQUEST"
  | "SPORTS_TEAM"
  | "COOPERATIVE"
  | "HOTEL_OFFER";

export type HotelServiceSection = {
  key: HotelServiceCategoryKey;
  slug: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  headline: string;
  howItWorks: string[];
  packageHint: string;
  requestHint: string;
  supportsPackages: boolean;
};

export const HOTEL_SERVICE_SECTIONS: HotelServiceSection[] = [
  {
    key: "GROUP_BOOKING",
    slug: "group-bookings",
    label: "Group bookings",
    shortLabel: "Groups",
    icon: Users,
    headline: "Block rooms for tours, weddings, and large travel groups",
    howItWorks: [
      "Publish a group package with minimum rooms, dates, and starting rate.",
      "Guests submit a group booking request with headcount and preferred dates.",
      "You review, send a custom quote, and confirm when payment is arranged.",
      "Confirmed groups appear in your workflow alongside standard hotel bookings.",
    ],
    packageHint: "e.g. 10+ rooms, airport transfer, breakfast included",
    requestHint: "Incoming group stay inquiries from your hotel listings",
    supportsPackages: true,
  },
  {
    key: "EVENT_CONFERENCE",
    slug: "events-conferences",
    label: "Events & conferences",
    shortLabel: "Events",
    icon: CalendarRange,
    headline: "Meeting halls, AV, catering, and delegate accommodation",
    howItWorks: [
      "List conference halls, boardrooms, and full-day delegate packages.",
      "Set capacity, equipment, and optional residential rates.",
      "Event planners request dates and layout — you confirm availability.",
      "Combine venue hire with room blocks in one professional quote.",
    ],
    packageHint: "e.g. 200-delegate hall + lunch + 30 twin rooms",
    requestHint: "Event and conference inquiries linked to this hotel",
    supportsPackages: true,
  },
  {
    key: "EVENT_BOOKING_REQUEST",
    slug: "event-requests",
    label: "Event booking requests",
    shortLabel: "Event requests",
    icon: ClipboardList,
    headline: "Inbox for weddings, galas, and corporate event enquiries",
    howItWorks: [
      "Guests submit event details: date, guest count, setup, and budget.",
      "Requests land here for your events team to review.",
      "Reply with a quote or schedule a site visit from the dashboard.",
      "Mark as confirmed once the client accepts your proposal.",
    ],
    packageHint: "",
    requestHint: "All open event booking requests — quote and confirm from here",
    supportsPackages: false,
  },
  {
    key: "SPORTS_TEAM",
    slug: "sports-teams",
    label: "Sports team packages",
    shortLabel: "Sports",
    icon: Trophy,
    headline: "Team travel — rooms, meals, and recovery for match days",
    howItWorks: [
      "Create sports team packages with room blocks and meal plans.",
      "Clubs submit travel dates, squad size, and training needs.",
      "Offer early check-in, team bus parking, and group dining rates.",
      "Ideal for football, rugby, athletics, and school sports tours.",
    ],
    packageHint: "e.g. 25 players + staff, dinner, late checkout",
    requestHint: "Team travel requests from clubs and academies",
    supportsPackages: true,
  },
  {
    key: "COOPERATIVE",
    slug: "cooperative",
    label: "Cooperative packages",
    shortLabel: "Co-op",
    icon: Briefcase,
    headline: "Corporate, SACCO, and member bulk-stay agreements",
    howItWorks: [
      "Publish negotiated rates for companies, cooperatives, and associations.",
      "Members book using your corporate code or request approval.",
      "Track volume stays and renew agreements each quarter.",
      "Separate from public nightly rates on your hotel listing.",
    ],
    packageHint: "e.g. SACCO member rate, 15% off Mon–Thu",
    requestHint: "Corporate and cooperative stay requests",
    supportsPackages: true,
  },
  {
    key: "HOTEL_OFFER",
    slug: "offers",
    label: "Hotel offers",
    shortLabel: "Offers",
    icon: BadgePercent,
    headline: "Seasonal promos, flash deals, and member-only discounts",
    howItWorks: [
      "Create limited-time offers — percentage off, free breakfast, or upgrades.",
      "Set validity dates so offers auto-expire.",
      "Offers display on your hotel listing and marketing pages.",
      "Guests book directly or request the offer if dates are flexible.",
    ],
    packageHint: "e.g. 20% off weekend stays until 31 Dec",
    requestHint: "Guests asking about active promotions",
    supportsPackages: true,
  },
];

export function getHotelSection(slug: string): HotelServiceSection | undefined {
  return HOTEL_SERVICE_SECTIONS.find((s) => s.slug === slug);
}

export function getHotelSectionByKey(
  key: HotelServiceCategoryKey,
): HotelServiceSection | undefined {
  return HOTEL_SERVICE_SECTIONS.find((s) => s.key === key);
}

export const HOTEL_CORE_TABS = [
  { href: "/dashboard/pro/hotels", label: "Overview", match: "overview" as const },
  { href: "/dashboard/pro/hotels/plans", label: "Plans", match: "prefix" as const },
  { href: "/dashboard/pro/hotels/listings", label: "Listings", match: "listings" as const },
  { href: "/dashboard/pro/hotels/bookings", label: "Bookings", match: "prefix" as const },
  { href: "/dashboard/pro/hotels/reviews", label: "Reviews", match: "prefix" as const },
];
