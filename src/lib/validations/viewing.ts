import { z } from "zod";

export const createViewingSchema = z.object({
  propertyId: z.string().min(1),
  scheduledAt: z.string().min(10),
  notes: z.string().trim().max(1000).optional().nullable(),
  phone: z.string().trim().min(9).max(15).optional().nullable(),
});

export const updateViewingStatusSchema = z.object({
  status: z.enum(["SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED"]),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export type CreateViewingInput = z.infer<typeof createViewingSchema>;
export type UpdateViewingStatusInput = z.infer<typeof updateViewingStatusSchema>;
