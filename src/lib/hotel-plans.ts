export const HOTEL_PLAN_TIER_IDS = [
  "FREE",
  "STARTER",
  "PRO",
  "BUSINESS",
  "ENTERPRISE",
] as const;

export type HotelPlanTierId = (typeof HOTEL_PLAN_TIER_IDS)[number];

export type StoredHotelPlanTier = HotelPlanTierId;

export type HotelPlanLimits = {
  maxImages: number;
  groupBookings: boolean;
  eventRequestsPerMonth: number | null; // null = unlimited, 0 = muted
  maxHotelPackages: number | null; // 0 = muted, null = unlimited
  bookingAnalytics: "basic" | "advanced";
};

export type HotelPlanProduct = {
  id: HotelPlanTierId;
  name: string;
  price: number;
  currency: "KES";
  durationDays: number;
  description: string;
  features: string[];
  popular?: boolean;
  limits: HotelPlanLimits;
};

export const HOTEL_PLANS: HotelPlanProduct[] = [
  {
    id: "FREE",
    name: "Free",
    price: 0,
    currency: "KES",
    durationDays: 36500,
    description: "List your hotel and accept standard nightly bookings.",
    features: [
      "Up to 3 photos per hotel listing",
      "Standard listings & bookings",
      "Basic booking analysis",
      "Guest reviews",
      "Group bookings: not included",
      "Event booking requests: not included",
      "Hotel packages: not included",
    ],
    limits: {
      maxImages: 3,
      groupBookings: false,
      eventRequestsPerMonth: 0,
      maxHotelPackages: 0,
      bookingAnalytics: "basic",
    },
  },
  {
    id: "STARTER",
    name: "Starter",
    price: 2999,
    currency: "KES",
    durationDays: 30,
    description: "Group stays, event requests, and published hotel packages.",
    features: [
      "Up to 30 photos per hotel listing",
      "Group bookings enabled",
      "5 event booking requests / month",
      "Up to 3 hotel packages",
      "Basic booking analysis",
    ],
    limits: {
      maxImages: 30,
      groupBookings: true,
      eventRequestsPerMonth: 5,
      maxHotelPackages: 3,
      bookingAnalytics: "basic",
    },
  },
  {
    id: "PRO",
    name: "Pro",
    price: 7999,
    currency: "KES",
    durationDays: 30,
    popular: true,
    description: "Full hotel toolkit with advanced booking insights.",
    features: [
      "Up to 100 photos per hotel listing",
      "Group bookings enabled",
      "Unlimited event booking requests",
      "Up to 10 hotel packages",
      "Advanced booking analysis",
    ],
    limits: {
      maxImages: 100,
      groupBookings: true,
      eventRequestsPerMonth: null,
      maxHotelPackages: 10,
      bookingAnalytics: "advanced",
    },
  },
  {
    id: "BUSINESS",
    name: "Business",
    price: 14999,
    currency: "KES",
    durationDays: 30,
    description: "For multi-property operators and busy conference hotels.",
    features: [
      "Up to 250 photos per hotel listing",
      "Group bookings enabled",
      "Unlimited event booking requests",
      "Up to 25 hotel packages",
      "Advanced booking analysis",
      "Priority email support",
    ],
    limits: {
      maxImages: 250,
      groupBookings: true,
      eventRequestsPerMonth: null,
      maxHotelPackages: 25,
      bookingAnalytics: "advanced",
    },
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: 24999,
    currency: "KES",
    durationDays: 30,
    description: "Hotel chains and large venues — maximum capacity and packages.",
    features: [
      "Up to 500 photos per hotel listing",
      "Group bookings enabled",
      "Unlimited event booking requests",
      "Unlimited hotel packages",
      "Advanced booking analysis",
      "Dedicated account support",
    ],
    limits: {
      maxImages: 500,
      groupBookings: true,
      eventRequestsPerMonth: null,
      maxHotelPackages: null,
      bookingAnalytics: "advanced",
    },
  },
];

export function normalizeHotelPlanTier(tier: string): HotelPlanTierId {
  if (HOTEL_PLAN_TIER_IDS.includes(tier as HotelPlanTierId)) {
    return tier as HotelPlanTierId;
  }
  return "FREE";
}

export function getHotelPlan(tier: StoredHotelPlanTier | string): HotelPlanProduct {
  const normalized = normalizeHotelPlanTier(tier);
  return HOTEL_PLANS.find((p) => p.id === normalized) ?? HOTEL_PLANS[0];
}

export function isHotelSectionMuted(
  tier: StoredHotelPlanTier | string,
  sectionKey: string,
): boolean {
  const limits = getHotelPlan(tier).limits;
  if (sectionKey === "GROUP_BOOKING") return !limits.groupBookings;
  if (sectionKey === "EVENT_BOOKING_REQUEST") {
    return limits.eventRequestsPerMonth === 0;
  }
  return false;
}

export function canCreateHotelPackages(tier: StoredHotelPlanTier | string): boolean {
  const cap = getHotelPlan(tier).limits.maxHotelPackages;
  return cap === null || cap > 0;
}

export function hotelMaxImages(tier: StoredHotelPlanTier | string): number {
  return getHotelPlan(tier).limits.maxImages;
}

export function formatHotelPackageCap(max: number | null): string {
  if (max === null) return "Unlimited";
  if (max === 0) return "—";
  return String(max);
}

export const HOTEL_PLAN_COMPARISON_ROWS: {
  label: string;
  value: (limits: HotelPlanLimits) => string;
}[] = [
  {
    label: "Photos per hotel",
    value: (l) => String(l.maxImages),
  },
  {
    label: "Group bookings",
    value: (l) => (l.groupBookings ? "✓" : "—"),
  },
  {
    label: "Event booking requests",
    value: (l) => {
      if (l.eventRequestsPerMonth === 0) return "—";
      if (l.eventRequestsPerMonth === null) return "Unlimited";
      return `${l.eventRequestsPerMonth} / month`;
    },
  },
  {
    label: "Hotel packages",
    value: (l) => formatHotelPackageCap(l.maxHotelPackages),
  },
  {
    label: "Booking analysis",
    value: (l) => (l.bookingAnalytics === "advanced" ? "Advanced" : "Basic"),
  },
];
