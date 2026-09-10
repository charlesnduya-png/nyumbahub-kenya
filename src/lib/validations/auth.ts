import { z } from "zod";

const kenyanPhoneRegex = /^(\+254|254|0)?[17]\d{8}$/;
/** International phones: optional +, 8–15 digits. */
const internationalPhoneRegex = /^\+?[0-9\s()-]{8,20}$/;
const kenyanNationalIdRegex = /^[A-Za-z0-9]{6,12}$/;
/** Passport / national ID for worldwide partners. */
const partnerIdRegex = /^[A-Za-z0-9]{6,20}$/;

export const userRoleSchema = z.enum(["BUYER", "SELLER", "AGENT", "JOB_PARTNER"]);

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters"),
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    phone: z.string().trim().min(1, "Phone number is required").max(20),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be at most 128 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    role: userRoleSchema.default("BUYER"),
    nationalId: z
      .string()
      .trim()
      .optional()
      .or(z.literal("").transform(() => undefined)),
    agencyName: z
      .string()
      .trim()
      .min(2, "Agency name must be at least 2 characters")
      .max(120)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    licenseNumber: z
      .string()
      .trim()
      .min(3, "License number must be at least 3 characters")
      .max(60)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    county: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    jobRef: z
      .string()
      .trim()
      .max(20)
      .optional()
      .or(z.literal("").transform(() => undefined)),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .superRefine((data, ctx) => {
    if (data.role === "JOB_PARTNER") {
      if (!internationalPhoneRegex.test(data.phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Enter a valid phone with country code (e.g. +254712345678 or +1…)",
          path: ["phone"],
        });
      }
    } else if (!kenyanPhoneRegex.test(data.phone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid Kenyan phone number (e.g. 0712345678)",
        path: ["phone"],
      });
    }

    if (data.role === "SELLER" || data.role === "AGENT") {
      if (!data.nationalId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "National ID is required for professional accounts",
          path: ["nationalId"],
        });
      } else if (!kenyanNationalIdRegex.test(data.nationalId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid National ID / passport number (6–12 characters)",
          path: ["nationalId"],
        });
      }
    }

    if (data.role === "AGENT") {
      if (!data.agencyName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Agency / company name is required for agents",
          path: ["agencyName"],
        });
      }
    }

    if (data.role === "JOB_PARTNER") {
      if (!data.nationalId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "National ID or passport number is required",
          path: ["nationalId"],
        });
      } else if (!partnerIdRegex.test(data.nationalId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid ID or passport number (6–20 characters)",
          path: ["nationalId"],
        });
      }
    }
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    token: z.string().min(1, "Reset token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be at most 128 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
