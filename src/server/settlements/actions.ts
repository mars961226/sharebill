"use server";

import { revalidatePath } from "next/cache";
import { calculateBalances } from "@/lib/balances";
import { canConfirmSettlement } from "@/lib/permissions";
import { buildSettlementPath } from "@/lib/settlements";
import { requireCurrentUser } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { confirmSettlementSchema } from "@/server/settlements/validation";

export type SettlementActionState = {
  error?: string;
  success?: string;
};

export async function confirmSettlementAction(
  _previousState: SettlementActionState,
  formData: FormData,
): Promise<SettlementActionState> {
  const user = await requireCurrentUser();
  const parsed = confirmSettlementSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Settlement is required." };
  }

  const currentMember = await prisma.bookMember.findFirst({
    where: {
      bookId: parsed.data.bookId,
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
    return { error: "You do not have access to this book." };
  }

  if (
    !canConfirmSettlement({
      member: currentMember,
      currentMemberId: currentMember.id,
      payerMemberId: parsed.data.payerMemberId,
      receiverMemberId: parsed.data.receiverMemberId,
    })
  ) {
    return { error: "You cannot confirm this settlement." };
  }

  const [members, expenses, settlements] = await Promise.all([
    prisma.bookMember.findMany({
      where: {
        bookId: parsed.data.bookId,
      },
      select: {
        id: true,
      },
    }),
    prisma.expense.findMany({
      where: {
        bookId: parsed.data.bookId,
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
        bookId: parsed.data.bookId,
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
      settlement.fromMemberId === parsed.data.payerMemberId &&
      settlement.toMemberId === parsed.data.receiverMemberId &&
      settlement.amountCents === parsed.data.amountCents,
  );

  if (!currentRecommendation) {
    return { error: "This settlement is no longer current." };
  }

  await prisma.settlement.create({
    data: {
      bookId: parsed.data.bookId,
      payerMemberId: parsed.data.payerMemberId,
      receiverMemberId: parsed.data.receiverMemberId,
      amountCents: parsed.data.amountCents,
      confirmedById: user.id,
    },
  });

  revalidatePath("/books");
  revalidatePath(`/books/${parsed.data.bookId}`);
  revalidatePath(`/books/${parsed.data.bookId}/expenses`);
  return { success: "Settlement confirmed." };
}
