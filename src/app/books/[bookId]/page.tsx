import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmSettlementForm } from "@/components/settlements/confirm-settlement-form";
import { calculateBalances } from "@/lib/balances";
import { formatEuro } from "@/lib/money";
import { canConfirmSettlement } from "@/lib/permissions";
import { buildSettlementPath } from "@/lib/settlements";
import { prisma } from "@/server/db";
import { requireCurrentUser } from "@/server/auth/session";

export default async function BookOverviewPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const user = await requireCurrentUser();
  const { bookId } = await params;

  const member = await prisma.bookMember.findFirst({
    where: {
      bookId,
      userId: user.id,
    },
    include: {
      book: {
        include: {
          members: {
            orderBy: {
              createdAt: "asc",
            },
          },
          expenses: {
            orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
            take: 5,
            include: {
              payer: true,
              createdBy: true,
              updatedBy: true,
            },
          },
          settlements: {
            orderBy: {
              confirmedAt: "desc",
            },
            include: {
              payer: true,
              receiver: true,
              confirmedBy: true,
            },
          },
        },
      },
    },
  });

  if (!member) {
    notFound();
  }

  const inviteUrl = `${process.env.APP_URL ?? "http://127.0.0.1:3000"}/join?code=${
    member.book.inviteCode
  }`;
  const ledgerExpenses = await prisma.expense.findMany({
    where: {
      bookId,
    },
    select: {
      amountCents: true,
      payerMemberId: true,
      participants: {
        select: {
          memberId: true,
          owedAmountCents: true,
        },
      },
    },
  });
  const balances = calculateBalances(
    member.book.members.map((bookMember) => bookMember.id),
    ledgerExpenses.map((expense) => ({
      payerMemberId: expense.payerMemberId,
      participantSplits: expense.participants,
    })),
    member.book.settlements.map((settlement) => ({
      payerMemberId: settlement.payerMemberId,
      receiverMemberId: settlement.receiverMemberId,
      amountCents: settlement.amountCents,
    })),
  );
  const balanceByMemberId = new Map(
    balances.map((balance) => [balance.memberId, balance.balanceCents]),
  );
  const memberNameById = new Map(
    member.book.members.map((bookMember) => [bookMember.id, bookMember.displayName]),
  );
  const settlementPath = buildSettlementPath(balances);
  const consumptionRankings = buildConsumptionRankings(
    member.book.members.map((bookMember) => ({
      id: bookMember.id,
      displayName: bookMember.displayName,
    })),
    ledgerExpenses,
  );

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Book overview</p>
          <h1>{member.book.name}</h1>
          <p className="muted">
            {member.role.toLowerCase()} · {member.book.members.length} members
          </p>
        </div>
        <div className="topbar-actions">
          <Link className="button secondary" href="/books">
            Back to books
          </Link>
        </div>
      </header>

      <nav className="tab-nav" aria-label="Book navigation">
        <Link className="tab-link active" href={`/books/${bookId}`}>
          Overview
        </Link>
        <Link className="tab-link tab-link-primary" href={`/books/${bookId}/expenses`}>
          Add expense
        </Link>
        <Link className="tab-link" href={`/books/${bookId}/members`}>
          Members
        </Link>
      </nav>

      <section className="two-column">
        <div className="section-block">
          <p className="eyebrow">Invite code</p>
          <h2>{member.book.inviteCode}</h2>
          <p className="muted">{inviteUrl}</p>
        </div>
        <div className="section-block">
          <p className="eyebrow">Members</p>
          <div className="list">
            {member.book.members.map((bookMember) => (
              <div className="list-row" key={bookMember.id}>
                <span>{bookMember.displayName}</span>
                <strong>
                  {bookMember.type === "PLACEHOLDER"
                    ? "temporary"
                    : bookMember.role.toLowerCase()}
                </strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="two-column section-gap">
        <div className="section-block">
          <p className="eyebrow">Balances</p>
          <h2>Member balances</h2>
          <div className="list balance-list">
            {member.book.members.map((bookMember) => {
              const balanceCents = balanceByMemberId.get(bookMember.id) ?? 0;

              return (
                <div className="list-row" key={bookMember.id}>
                  <span>{bookMember.displayName}</span>
                  <strong className={balanceClassName(balanceCents)}>
                    {formatSignedEuro(balanceCents)}
                  </strong>
                </div>
              );
            })}
          </div>
        </div>
        <div className="section-block">
          <p className="eyebrow">Recommended settlement path</p>
          <h2>Who pays whom</h2>
          {settlementPath.length > 0 ? (
            <div className="list">
              {settlementPath.map((settlement) => {
                const canConfirm = canConfirmSettlement({
                  member,
                  currentMemberId: member.id,
                  payerMemberId: settlement.fromMemberId,
                  receiverMemberId: settlement.toMemberId,
                });

                return (
                  <div
                    className="list-row"
                    key={`${settlement.fromMemberId}:${settlement.toMemberId}:${settlement.amountCents}`}
                  >
                    <span>
                      {memberNameById.get(settlement.fromMemberId)} pays{" "}
                      {memberNameById.get(settlement.toMemberId)}
                    </span>
                    <div className="row-actions">
                      <strong>{formatEuro(settlement.amountCents)}</strong>
                      {canConfirm ? (
                        <ConfirmSettlementForm
                          amountCents={settlement.amountCents}
                          amountLabel={formatEuro(settlement.amountCents)}
                          bookId={bookId}
                          payerMemberId={settlement.fromMemberId}
                          payerName={
                            memberNameById.get(settlement.fromMemberId) ??
                            "Unknown member"
                          }
                          receiverMemberId={settlement.toMemberId}
                          receiverName={
                            memberNameById.get(settlement.toMemberId) ??
                            "Unknown member"
                          }
                        />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="muted">No settlement needed.</p>
          )}
        </div>
      </section>

      <section className="section-block section-gap">
        <p className="eyebrow">Settlement history</p>
        <h2>Confirmed settlements</h2>
        {member.book.settlements.length > 0 ? (
          <div className="list">
            {member.book.settlements.map((settlement) => (
              <div className="list-row" key={settlement.id}>
                <span>
                  {settlement.payer.displayName} paid{" "}
                  {settlement.receiver.displayName} · confirmed by{" "}
                  {settlement.confirmedBy.displayName} ·{" "}
                  {settlement.confirmedAt.toLocaleDateString("en-GB")}
                </span>
                <strong>{formatEuro(settlement.amountCents)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No confirmed settlements yet.</p>
        )}
      </section>

      <section className="section-block section-gap">
        <p className="eyebrow">Consumption stats</p>
        <h2>Total consumed ranking</h2>
        <div className="list">
          {consumptionRankings.map((ranking) => (
            <div className="list-row ranking-row" key={ranking.memberId}>
              <span>
                <strong className="rank-badge">#{ranking.rank}</strong>
                {ranking.displayName}
              </span>
              <strong>{formatEuro(ranking.consumedCents)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="section-block section-gap">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Recent expenses</p>
            <h2>Latest activity</h2>
          </div>
          <Link className="button secondary small" href={`/books/${bookId}/expenses`}>
            View all
          </Link>
        </div>
        {member.book.expenses.length > 0 ? (
          <div className="list">
            {member.book.expenses.map((expense) => (
              <div className="list-row" key={expense.id}>
                <div>
                  <span>{expense.title}</span>
                  <p className="field-help">
                    Spent {expense.expenseDate.toLocaleDateString("en-GB")} ·{" "}
                    {expense.updatedBy && isEditedExpense(expense)
                      ? `edited ${expense.updatedAt.toLocaleDateString("en-GB")} by ${expense.updatedBy.displayName}`
                      : `added ${expense.createdAt.toLocaleDateString("en-GB")} by ${expense.createdBy.displayName}`}{" "}
                    · paid by {expense.payer.displayName}
                  </p>
                </div>
                <strong>{formatEuro(expense.amountCents)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No expenses yet.</p>
        )}
      </section>
    </main>
  );
}

function formatSignedEuro(cents: number): string {
  if (cents === 0) {
    return formatEuro(0);
  }

  return `${cents > 0 ? "+" : "-"}${formatEuro(Math.abs(cents))}`;
}

function balanceClassName(cents: number): string {
  if (cents > 0) {
    return "balance-positive";
  }

  if (cents < 0) {
    return "balance-negative";
  }

  return "balance-zero";
}

function isEditedExpense(expense: {
  createdAt: Date;
  updatedAt: Date;
}): boolean {
  return expense.updatedAt.getTime() - expense.createdAt.getTime() > 1000;
}

function buildConsumptionRankings(
  members: Array<{ id: string; displayName: string }>,
  expenses: Array<{
    participants: Array<{ memberId: string; owedAmountCents: number }>;
  }>,
): Array<{
  memberId: string;
  displayName: string;
  consumedCents: number;
  rank: number;
}> {
  const consumedByMemberId = new Map(members.map((member) => [member.id, 0]));

  for (const expense of expenses) {
    for (const participant of expense.participants) {
      consumedByMemberId.set(
        participant.memberId,
        (consumedByMemberId.get(participant.memberId) ?? 0) +
          participant.owedAmountCents,
      );
    }
  }

  let previousConsumedCents: number | null = null;
  let currentRank = 0;

  return members
    .map((member) => ({
      memberId: member.id,
      displayName: member.displayName,
      consumedCents: consumedByMemberId.get(member.id) ?? 0,
    }))
    .sort((a, b) => {
      if (b.consumedCents !== a.consumedCents) {
        return b.consumedCents - a.consumedCents;
      }

      return a.displayName.localeCompare(b.displayName);
    })
    .map((member, index) => {
      if (previousConsumedCents !== member.consumedCents) {
        currentRank = index + 1;
        previousConsumedCents = member.consumedCents;
      }

      return {
        ...member,
        rank: currentRank,
      };
    });
}
