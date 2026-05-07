import { z } from "zod";

export const expenseParticipantSchema = z.object({
  memberId: z.string().min(1),
  owedAmountCents: z.number().int().positive(),
});

export const createExpenseSchema = z.object({
  bookId: z.string().min(1),
  title: z.string().trim().min(1),
  expenseDate: z.coerce
    .date()
    .refine((date) => date.getTime() <= Date.now(), {
      message: "Expense date cannot be in the future.",
    }),
  amountCents: z.number().int().positive(),
  payerMemberId: z.string().min(1),
  splitMethod: z.enum(["EQUAL", "CUSTOM"]),
  participants: z.array(expenseParticipantSchema).min(1),
});
