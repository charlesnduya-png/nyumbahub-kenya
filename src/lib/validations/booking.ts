import { z } from "zod";

export const createBookingSchema = z
  .object({
    propertyId: z.string().min(1),
    checkIn: z.string().min(1),
    checkOut: z.string().min(1),
    guests: z.coerce.number().int().min(1).max(30).default(1),
    guestMessage: z.string().trim().max(2000).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);
    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter valid check-in and check-out dates",
        path: ["checkIn"],
      });
      return;
    }
    const start = new Date(checkIn.toISOString().slice(0, 10));
    const end = new Date(checkOut.toISOString().slice(0, 10));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Check-in cannot be in the past",
        path: ["checkIn"],
      });
    }
    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Check-out must be after check-in",
        path: ["checkOut"],
      });
    }
  });

export const updateBookingStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "CANCELLED"]),
  ownerNote: z.string().trim().max(1000).optional().nullable(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;

export function nightsBetween(checkIn: Date, checkOut: Date): number {
  const start = Date.UTC(
    checkIn.getFullYear(),
    checkIn.getMonth(),
    checkIn.getDate(),
  );
  const end = Date.UTC(
    checkOut.getFullYear(),
    checkOut.getMonth(),
    checkOut.getDate(),
  );
  return Math.max(1, Math.round((end - start) / (24 * 60 * 60 * 1000)));
}
