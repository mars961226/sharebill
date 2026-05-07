import { describe, expect, it } from "vitest";
import { calculateBalances } from "@/lib/balances";
import { buildSettlementPath } from "@/lib/settlements";

describe("calculateBalances", () => {
  it("keeps rounded equal splits balanced by crediting split total", () => {
    const balances = calculateBalances(
      ["payer", "a", "b"],
      [
        {
          payerMemberId: "payer",
          participantSplits: [
            { memberId: "payer", owedAmountCents: 334 },
            { memberId: "a", owedAmountCents: 334 },
            { memberId: "b", owedAmountCents: 334 },
          ],
        },
      ],
      [],
    );

    expect(sumBalances(balances)).toBe(0);
    expect(balances).toContainEqual({
      memberId: "payer",
      balanceCents: 668,
    });
  });

  it("applies confirmed settlements to future balances", () => {
    const balances = calculateBalances(
      ["payer", "a"],
      [
        {
          payerMemberId: "payer",
          participantSplits: [
            { memberId: "payer", owedAmountCents: 500 },
            { memberId: "a", owedAmountCents: 500 },
          ],
        },
      ],
      [{ payerMemberId: "a", receiverMemberId: "payer", amountCents: 500 }],
    );

    expect(balances).toContainEqual({ memberId: "payer", balanceCents: 0 });
    expect(balances).toContainEqual({ memberId: "a", balanceCents: 0 });
  });
});

describe("buildSettlementPath", () => {
  it("gives each member at most one outgoing payment", () => {
    const recommendations = buildSettlementPath([
      { memberId: "a", balanceCents: -10000 },
      { memberId: "b", balanceCents: 6000 },
      { memberId: "c", balanceCents: 4000 },
    ]);

    expect(recommendations).toEqual([
      { fromMemberId: "a", toMemberId: "c", amountCents: 10000 },
      { fromMemberId: "c", toMemberId: "b", amountCents: 6000 },
    ]);

    const outgoingCounts = new Map<string, number>();

    for (const recommendation of recommendations) {
      outgoingCounts.set(
        recommendation.fromMemberId,
        (outgoingCounts.get(recommendation.fromMemberId) ?? 0) + 1,
      );
    }

    expect([...outgoingCounts.values()].every((count) => count <= 1)).toBe(true);
  });
});

function sumBalances(balances: Array<{ balanceCents: number }>): number {
  return balances.reduce((sum, balance) => sum + balance.balanceCents, 0);
}
