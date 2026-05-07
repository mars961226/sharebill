export type ExpenseLedgerEntry = {
  payerMemberId: string;
  participantSplits: Array<{
    memberId: string;
    owedAmountCents: number;
  }>;
};

export type SettlementLedgerEntry = {
  payerMemberId: string;
  receiverMemberId: string;
  amountCents: number;
};

export type MemberBalance = {
  memberId: string;
  balanceCents: number;
};

export function calculateBalances(
  memberIds: string[],
  expenses: ExpenseLedgerEntry[],
  settlements: SettlementLedgerEntry[],
): MemberBalance[] {
  const balances = new Map<string, number>();

  for (const memberId of memberIds) {
    balances.set(memberId, 0);
  }

  for (const expense of expenses) {
    const splitTotal = expense.participantSplits.reduce(
      (sum, split) => sum + split.owedAmountCents,
      0,
    );

    addBalance(balances, expense.payerMemberId, splitTotal);

    for (const split of expense.participantSplits) {
      addBalance(balances, split.memberId, -split.owedAmountCents);
    }
  }

  for (const settlement of settlements) {
    addBalance(balances, settlement.payerMemberId, settlement.amountCents);
    addBalance(balances, settlement.receiverMemberId, -settlement.amountCents);
  }

  return [...balances.entries()].map(([memberId, balanceCents]) => ({
    memberId,
    balanceCents,
  }));
}

function addBalance(
  balances: Map<string, number>,
  memberId: string,
  amountCents: number,
): void {
  balances.set(memberId, (balances.get(memberId) ?? 0) + amountCents);
}
