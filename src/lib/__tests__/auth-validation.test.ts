import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

describe("auth validation", () => {
  it("accepts valid login", () => {
    const result = loginSchema.safeParse({
      email: "buyer@nyumbahub.co.ke",
      password: "Password123!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "Password123!",
    });
    expect(result.success).toBe(false);
  });

  it("accepts seller registration", () => {
    const result = registerSchema.safeParse({
      name: "Grace Wanjiku",
      email: "grace@example.com",
      phone: "0712345678",
      password: "Password123!",
      confirmPassword: "Password123!",
      role: "SELLER",
    });
    expect(result.success).toBe(true);
  });
});
