import { z } from "zod";

export const confirmSettlementSchema = z.object({
  bookId: z.string().min(1),
  payerMemberId: z.string().min(1),
  receiverMemberId: z.string().min(1),
  amountCents: z.number().int().positive(),
});
