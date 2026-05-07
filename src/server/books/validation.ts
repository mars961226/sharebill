import { z } from "zod";

export const createBookSchema = z.object({
  name: z.string().trim().min(1),
});

export const joinBookSchema = z.object({
  inviteCode: z.string().trim().min(1),
  placeholderMemberId: z.string().min(1).optional(),
});
