/** Free Your Home membership for signed-in customers (Genius-style). */

export const MEMBERSHIP_NAME = "Your Home Member";

export const MEMBERSHIP_LEVELS = [
  {
    level: 1 as const,
    name: "Member",
    minStays: 0,
    discountRate: 0.1,
    perks: [
      "10% off BnB stays when you book signed in",
      "Save homes, compare listings, and message hosts",
      "Write a guest review after your stay",
    ],
  },
  {
    level: 2 as const,
    name: "Member Plus",
    minStays: 3,
    discountRate: 0.12,
    perks: [
      "12% off BnB stays",
      "Priority on member deals",
      "Review stays like a verified guest",
    ],
  },
  {
    level: 3 as const,
    name: "Member Max",
    minStays: 8,
    discountRate: 0.15,
    perks: [
      "15% off BnB stays",
      "Highest member saving on Your Home",
      "Recognized as a frequent guest",
    ],
  },
] as const;

export type MembershipLevel = (typeof MEMBERSHIP_LEVELS)[number]["level"];

export function membershipLevelFromStays(completedStays: number): MembershipLevel {
  const stays = Number.isFinite(completedStays) ? Math.max(0, completedStays) : 0;
  if (stays >= MEMBERSHIP_LEVELS[2].minStays) return 3;
  if (stays >= MEMBERSHIP_LEVELS[1].minStays) return 2;
  return 1;
}

export function membershipForLevel(level: MembershipLevel) {
  return MEMBERSHIP_LEVELS.find((item) => item.level === level) ?? MEMBERSHIP_LEVELS[0];
}

export function membershipForStays(completedStays: number) {
  return membershipForLevel(membershipLevelFromStays(completedStays));
}

function roundMoney(value: number) {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

export function applyMemberPrice(listAmount: number, level: MembershipLevel) {
  const list = roundMoney(Math.max(0, listAmount));
  const { discountRate } = membershipForLevel(level);
  const discountAmount = roundMoney(list * discountRate);
  const guestPays = roundMoney(list - discountAmount);
  return {
    listAmount: list,
    discountAmount,
    guestPays,
    discountRate,
    discountPercent: Math.round(discountRate * 100),
    level,
  };
}

export function staysToNextLevel(completedStays: number) {
  const level = membershipLevelFromStays(completedStays);
  const next = MEMBERSHIP_LEVELS.find((item) => item.level === level + 1);
  if (!next) return null;
  return {
    nextLevel: next.level,
    nextName: next.name,
    staysNeeded: Math.max(0, next.minStays - completedStays),
    nextDiscountPercent: Math.round(next.discountRate * 100),
  };
}

export function reviewScoreLabel(score: number) {
  if (score >= 9) return "Wonderful";
  if (score >= 8) return "Excellent";
  if (score >= 7) return "Good";
  if (score >= 6) return "Pleasant";
  if (score >= 5) return "Okay";
  return "Review score";
}

export function guestDisplayName(name: string | null | undefined) {
  const trimmed = name?.trim();
  if (!trimmed) return "Guest";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
}

export function canReviewStay(input: {
  status: string;
  checkOut: Date | string;
  hasReview: boolean;
}) {
  if (input.hasReview) return false;
  if (input.status === "COMPLETED") return true;
  if (input.status !== "APPROVED") return false;
  const checkOut = new Date(input.checkOut);
  if (Number.isNaN(checkOut.getTime())) return false;
  return checkOut.getTime() <= Date.now();
}
