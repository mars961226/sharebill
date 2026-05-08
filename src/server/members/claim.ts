import { prisma } from "@/server/db";

export const CLAIM_BLOCKED_BY_SETTLEMENT_MESSAGE =
  "Temporary members used in confirmed settlements cannot be claimed yet.";

export async function assertPlaceholderCanBeClaimed(
  placeholderMemberId: string,
): Promise<void> {
  const settlementUsage = await prisma.bookMember.findUnique({
    where: {
      id: placeholderMemberId,
    },
    select: {
      _count: {
        select: {
          settlementsPaid: true,
          settlementsReceived: true,
        },
      },
    },
  });

  if (!settlementUsage) {
    throw new Error("Temporary member not found.");
  }

  if (
    settlementUsage._count.settlementsPaid > 0 ||
    settlementUsage._count.settlementsReceived > 0
  ) {
    throw new Error(CLAIM_BLOCKED_BY_SETTLEMENT_MESSAGE);
  }
}

export async function mergePlaceholderIntoRealMember({
  bookId,
  placeholderMemberId,
  realMemberId,
}: {
  bookId: string;
  placeholderMemberId: string;
  realMemberId: string;
}): Promise<void> {
  if (placeholderMemberId === realMemberId) {
    throw new Error("Cannot claim yourself.");
  }

  await assertPlaceholderCanBeClaimed(placeholderMemberId);

  await prisma.$transaction(async (tx) => {
    const [placeholder, realMember] = await Promise.all([
      tx.bookMember.findFirst({
        where: {
          id: placeholderMemberId,
          bookId,
          type: "PLACEHOLDER",
          userId: null,
        },
        select: {
          id: true,
        },
      }),
      tx.bookMember.findFirst({
        where: {
          id: realMemberId,
          bookId,
          type: "REAL",
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (!placeholder) {
      throw new Error("That temporary member cannot be claimed.");
    }

    if (!realMember) {
      throw new Error("You do not have access to this book.");
    }

    const placeholderSplits = await tx.expenseParticipant.findMany({
      where: {
        memberId: placeholderMemberId,
      },
      select: {
        id: true,
        expenseId: true,
        owedAmountCents: true,
      },
    });

    for (const placeholderSplit of placeholderSplits) {
      const realSplit = await tx.expenseParticipant.findUnique({
        where: {
          expenseId_memberId: {
            expenseId: placeholderSplit.expenseId,
            memberId: realMemberId,
          },
        },
        select: {
          id: true,
          owedAmountCents: true,
        },
      });

      if (realSplit) {
        await tx.expenseParticipant.update({
          where: {
            id: realSplit.id,
          },
          data: {
            owedAmountCents:
              realSplit.owedAmountCents + placeholderSplit.owedAmountCents,
          },
        });
        await tx.expenseParticipant.delete({
          where: {
            id: placeholderSplit.id,
          },
        });
      } else {
        await tx.expenseParticipant.update({
          where: {
            id: placeholderSplit.id,
          },
          data: {
            memberId: realMemberId,
          },
        });
      }
    }

    await tx.expense.updateMany({
      where: {
        bookId,
        payerMemberId: placeholderMemberId,
      },
      data: {
        payerMemberId: realMemberId,
      },
    });

    await tx.bookMember.delete({
      where: {
        id: placeholderMemberId,
      },
    });
  });
}
