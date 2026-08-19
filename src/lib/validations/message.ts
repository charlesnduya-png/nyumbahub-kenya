import { z } from "zod";

export const sendMessageSchema = z.object({
  receiverId: z.string().min(1),
  content: z.string().trim().min(1).max(5000),
  propertyId: z.string().trim().optional().nullable(),
});

export const listMessagesSchema = z.object({
  peerId: z.string().min(1),
  propertyId: z.string().trim().optional().nullable(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
