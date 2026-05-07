import type { MemberBalance } from "@/lib/balances";

export type SettlementRecommendation = {
  fromMemberId: string;
  toMemberId: string;
  amountCents: number;
};

export function buildSettlementPath(
  balances: MemberBalance[],
): SettlementRecommendation[] {
  const sorted = balances
    .filter((member) => member.balanceCents !== 0)
    .sort((a, b) => a.balanceCents - b.balanceCents);

  const total = sorted.reduce((sum, member) => sum + member.balanceCents, 0);

  if (total !== 0) {
    throw new Error("Balance total must be zero before settlement.");
  }

  const recommendations: SettlementRecommendation[] = [];
  let runningBalance = 0;

  for (let index = 0; index < sorted.length - 1; index += 1) {
    runningBalance += sorted[index].balanceCents;

    if (runningBalance < 0) {
      recommendations.push({
        fromMemberId: sorted[index].memberId,
        toMemberId: sorted[index + 1].memberId,
        amountCents: Math.abs(runningBalance),
      });
    }
  }

  return recommendations;
}
