import { describe, expect, it } from "vitest";
import { splitBnbPayment } from "@/lib/bnb-split";

describe("BnB payment split", () => {
  it("gives the site 10% and the host 90%", () => {
    const split = splitBnbPayment(10000);
    expect(split.commissionAmount).toBe(1000);
    expect(split.hostAmount).toBe(9000);
    expect(split.grossAmount).toBe(10000);
  });

  it("keeps host plus commission equal to the guest total", () => {
    const split = splitBnbPayment(7550);
    expect(split.hostAmount + split.commissionAmount).toBe(split.grossAmount);
  });
});
