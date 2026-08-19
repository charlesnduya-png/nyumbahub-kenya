import { z } from "zod";

export const createRentalReservationSchema = z.object({
  moveInDate: z.string().optional(),
  message: z.string().trim().max(2000).optional(),
  rentalRoomId: z.string().min(1).optional(),
});

export const updateRentalReservationSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "RENTED", "CANCELLED"]),
  adminNotes: z.string().trim().max(2000).optional(),
});
