import { z } from "zod";

export const createPlaceholderMemberSchema = z.object({
  bookId: z.string().min(1),
  displayName: z.string().trim().min(1),
});

export const deletePlaceholderMemberSchema = z.object({
  bookId: z.string().min(1),
  memberId: z.string().min(1),
});
