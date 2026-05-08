import { z } from "zod";

export const createBookSchema = z.object({
  name: z.string().trim().min(1),
});

export const joinBookSchema = z.object({
  inviteCode: z.string().trim().min(1),
  joinMode: z.string().optional(),
  placeholderMemberId: z.string().optional(),
});
