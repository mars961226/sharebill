import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const prisma = {
    bookMember: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  return { prisma };
});

vi.mock("@/server/db", () => ({
  prisma: mocks.prisma,
}));

import {
  assertPlaceholderCanBeClaimed,
  CLAIM_BLOCKED_BY_SETTLEMENT_MESSAGE,
  mergePlaceholderIntoRealMember,
} from "@/server/members/claim";

describe("assertPlaceholderCanBeClaimed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows placeholder members that are not used in confirmed settlements", async () => {
    mocks.prisma.bookMember.findUnique.mockResolvedValue({
      _count: {
        settlementsPaid: 0,
        settlementsReceived: 0,
      },
    });

    await expect(assertPlaceholderCanBeClaimed("placeholder")).resolves.toBeUndefined();
  });

  it("rejects placeholder members used in confirmed settlements", async () => {
    mocks.prisma.bookMember.findUnique.mockResolvedValue({
      _count: {
        settlementsPaid: 1,
        settlementsReceived: 0,
      },
    });

    await expect(assertPlaceholderCanBeClaimed("placeholder")).rejects.toThrow(
      CLAIM_BLOCKED_BY_SETTLEMENT_MESSAGE,
    );
  });
});

describe("mergePlaceholderIntoRealMember", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.bookMember.findUnique.mockResolvedValue({
      _count: {
        settlementsPaid: 0,
        settlementsReceived: 0,
      },
    });
  });

  it("moves payer references and merges participant splits into the real member", async () => {
    const participantSplits = [
      {
        id: "placeholder-split-same-expense",
        expenseId: "expense-a",
        memberId: "placeholder",
        owedAmountCents: 300,
      },
      {
        id: "real-split-same-expense",
        expenseId: "expense-a",
        memberId: "real",
        owedAmountCents: 200,
      },
      {
        id: "placeholder-split-only",
        expenseId: "expense-b",
        memberId: "placeholder",
        owedAmountCents: 700,
      },
    ];
    const payerUpdates: Array<{ bookId: string; payerMemberId: string }> = [];
    const deletedBookMembers: string[] = [];

    mocks.prisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        bookMember: {
          findFirst: vi.fn(async ({ where }) => {
            if (where.id === "placeholder") {
              return { id: "placeholder" };
            }

            if (where.id === "real") {
              return { id: "real" };
            }

            return null;
          }),
          delete: vi.fn(async ({ where }) => {
            deletedBookMembers.push(where.id);
          }),
        },
        expenseParticipant: {
          findMany: vi.fn(async ({ where }) =>
            participantSplits
              .filter((split) => split.memberId === where.memberId)
              .map(({ id, expenseId, owedAmountCents }) => ({
                id,
                expenseId,
                owedAmountCents,
              })),
          ),
          findUnique: vi.fn(async ({ where }) => {
            const split = participantSplits.find(
              (candidate) =>
                candidate.expenseId === where.expenseId_memberId.expenseId &&
                candidate.memberId === where.expenseId_memberId.memberId,
            );

            return split
              ? {
                  id: split.id,
                  owedAmountCents: split.owedAmountCents,
                }
              : null;
          }),
          update: vi.fn(async ({ where, data }) => {
            const split = participantSplits.find((candidate) => candidate.id === where.id);

            if (!split) {
              throw new Error("Split not found.");
            }

            Object.assign(split, data);
          }),
          delete: vi.fn(async ({ where }) => {
            const index = participantSplits.findIndex(
              (candidate) => candidate.id === where.id,
            );

            if (index >= 0) {
              participantSplits.splice(index, 1);
            }
          }),
        },
        expense: {
          updateMany: vi.fn(async ({ where }) => {
            payerUpdates.push({
              bookId: where.bookId,
              payerMemberId: where.payerMemberId,
            });
          }),
        },
      };

      return callback(tx);
    });

    await mergePlaceholderIntoRealMember({
      bookId: "book",
      placeholderMemberId: "placeholder",
      realMemberId: "real",
    });

    expect(participantSplits).toContainEqual({
      id: "real-split-same-expense",
      expenseId: "expense-a",
      memberId: "real",
      owedAmountCents: 500,
    });
    expect(participantSplits).not.toContainEqual(
      expect.objectContaining({ id: "placeholder-split-same-expense" }),
    );
    expect(participantSplits).toContainEqual({
      id: "placeholder-split-only",
      expenseId: "expense-b",
      memberId: "real",
      owedAmountCents: 700,
    });
    expect(payerUpdates).toEqual([
      {
        bookId: "book",
        payerMemberId: "placeholder",
      },
    ]);
    expect(deletedBookMembers).toEqual(["placeholder"]);
  });
});
