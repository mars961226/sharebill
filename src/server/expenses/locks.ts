import { prisma } from "@/server/db";

export const LOCKED_EXPENSE_MESSAGE =
  "This expense was recorded before a settlement was confirmed and can no longer be edited or deleted.";

export type ExpenseLockSnapshot = {
  latestSettlementConfirmedAt: Date | null;
};

export async function getExpenseLockSnapshot(
  bookId: string,
): Promise<ExpenseLockSnapshot> {
  const latestSettlement = await prisma.settlement.findFirst({
    where: {
      bookId,
    },
    orderBy: {
      confirmedAt: "desc",
    },
    select: {
      confirmedAt: true,
    },
  });

  return {
    latestSettlementConfirmedAt: latestSettlement?.confirmedAt ?? null,
  };
}

export function isExpenseLocked(
  expense: { createdAt: Date },
  lockSnapshot: ExpenseLockSnapshot,
): boolean {
  return (
    lockSnapshot.latestSettlementConfirmedAt !== null &&
    expense.createdAt.getTime() <= lockSnapshot.latestSettlementConfirmedAt.getTime()
  );
}
