import { describe, expect, it } from "vitest";
import {
  applyMemberPrice,
  canReviewStay,
  membershipLevelFromStays,
  reviewScoreLabel,
} from "@/lib/membership";

describe("membership", () => {
  it("starts every customer at 10% off", () => {
    expect(membershipLevelFromStays(0)).toBe(1);
    const price = applyMemberPrice(10000, 1);
    expect(price.guestPays).toBe(9000);
    expect(price.discountPercent).toBe(10);
  });

  it("raises the discount after completed stays", () => {
    expect(membershipLevelFromStays(3)).toBe(2);
    expect(applyMemberPrice(10000, 2).guestPays).toBe(8800);
    expect(membershipLevelFromStays(8)).toBe(3);
    expect(applyMemberPrice(10000, 3).guestPays).toBe(8500);
  });

  it("lets guests review after checkout", () => {
    expect(
      canReviewStay({
        status: "APPROVED",
        checkOut: new Date(Date.now() - 86_400_000),
        hasReview: false,
      }),
    ).toBe(true);
    expect(
      canReviewStay({
        status: "PENDING",
        checkOut: new Date(Date.now() - 86_400_000),
        hasReview: false,
      }),
    ).toBe(false);
  });

  it("labels Booking.com-style scores", () => {
    expect(reviewScoreLabel(9.2)).toBe("Wonderful");
    expect(reviewScoreLabel(8.1)).toBe("Excellent");
  });
});
