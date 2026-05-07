"use server";

import { revalidatePath } from "next/cache";
import { calculateBalances } from "@/lib/balances";
import { canConfirmSettlement } from "@/lib/permissions";
import { buildSettlementPath } from "@/lib/settlements";
import { requireCurrentUser } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { confirmSettlementSchema } from "@/server/settlements/validation";

export async function confirmSettlementAction(formData: FormData): Promise<void> {
  const user = await requireCurrentUser();
  const parsed = confirmSettlementSchema.parse(Object.fromEntries(formData));

  const currentMember = await prisma.bookMember.findFirst({
    where: {
      bookId: parsed.bookId,
      userId: user.id,
      type: "REAL",
    },
    select: {
      id: true,
      role: true,
      userId: true,
    },
  });

  if (!currentMember) {
    throw new Error("You do not have access to this book.");
  }

  if (
    !canConfirmSettlement({
      member: currentMember,
      currentMemberId: currentMember.id,
      payerMemberId: parsed.payerMemberId,
      receiverMemberId: parsed.receiverMemberId,
    })
  ) {
    throw new Error("You cannot confirm this settlement.");
  }

  const [members, expenses, settlements] = await Promise.all([
    prisma.bookMember.findMany({
      where: {
        bookId: parsed.bookId,
      },
      select: {
        id: true,
      },
    }),
    prisma.expense.findMany({
      where: {
        bookId: parsed.bookId,
      },
      select: {
        payerMemberId: true,
        participants: {
          select: {
            memberId: true,
            owedAmountCents: true,
          },
        },
      },
    }),
    prisma.settlement.findMany({
      where: {
        bookId: parsed.bookId,
      },
      select: {
        payerMemberId: true,
        receiverMemberId: true,
        amountCents: true,
      },
    }),
  ]);

  const balances = calculateBalances(
    members.map((member) => member.id),
    expenses.map((expense) => ({
      payerMemberId: expense.payerMemberId,
      participantSplits: expense.participants,
    })),
    settlements,
  );
  const currentRecommendation = buildSettlementPath(balances).find(
    (settlement) =>
      settlement.fromMemberId === parsed.payerMemberId &&
      settlement.toMemberId === parsed.receiverMemberId &&
      settlement.amountCents === parsed.amountCents,
  );

  if (!currentRecommendation) {
    throw new Error("This settlement is no longer current.");
  }

  await prisma.settlement.create({
    data: {
      bookId: parsed.bookId,
      payerMemberId: parsed.payerMemberId,
      receiverMemberId: parsed.receiverMemberId,
      amountCents: parsed.amountCents,
      confirmedById: user.id,
    },
  });

  revalidatePath("/books");
  revalidatePath(`/books/${parsed.bookId}`);
  revalidatePath(`/books/${parsed.bookId}/expenses`);
}
