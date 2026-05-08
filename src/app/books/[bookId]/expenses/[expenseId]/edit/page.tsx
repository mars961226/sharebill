import Link from "next/link";
import { notFound } from "next/navigation";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { euroInputValue } from "@/lib/money";
import { requireCurrentUser } from "@/server/auth/session";
import { prisma } from "@/server/db";
import {
  getExpenseLockSnapshot,
  isExpenseLocked,
  LOCKED_EXPENSE_MESSAGE,
} from "@/server/expenses/locks";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ bookId: string; expenseId: string }>;
}) {
  const user = await requireCurrentUser();
  const { bookId, expenseId } = await params;

  const currentMember = await prisma.bookMember.findFirst({
    where: {
      bookId,
      userId: user.id,
      type: "REAL",
    },
    include: {
      book: {
        include: {
          members: {
            orderBy: [{ type: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });

  if (!currentMember) {
    notFound();
  }

  const expense = await prisma.expense.findFirst({
    where: {
      id: expenseId,
      bookId,
    },
    include: {
      participants: true,
    },
  });

  if (!expense) {
    notFound();
  }

  const locked = isExpenseLocked(expense, await getExpenseLockSnapshot(bookId));

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Edit expense</p>
          <h1>{currentMember.book.name}</h1>
          <p className="muted">{expense.title}</p>
        </div>
        <div className="topbar-actions">
          <Link className="button secondary" href={`/books/${bookId}/expenses`}>
            Expenses
          </Link>
          <Link className="button secondary" href={`/books/${bookId}`}>
            Overview
          </Link>
        </div>
      </header>

      <section className="form-section">
        {locked ? (
          <div className="panel compact-panel">
            <div>
              <p className="eyebrow">Locked expense</p>
              <h2>This expense can no longer be edited</h2>
            </div>
            <p className="alert error">{LOCKED_EXPENSE_MESSAGE}</p>
            <Link className="button secondary" href={`/books/${bookId}/expenses`}>
              Back to expenses
            </Link>
          </div>
        ) : (
          <ExpenseForm
            bookId={bookId}
            initialValue={{
              id: expense.id,
              title: expense.title,
              expenseDate: expense.expenseDate.toISOString().slice(0, 10),
              amount: euroInputValue(expense.amountCents),
              payerMemberId: expense.payerMemberId,
              splitMethod: expense.splitMethod,
              participants: expense.participants.map((participant) => ({
                memberId: participant.memberId,
                amount: euroInputValue(participant.owedAmountCents),
              })),
            }}
            members={currentMember.book.members.map((member) => ({
              id: member.id,
              displayName: member.displayName,
              type: member.type,
            }))}
          />
        )}
      </section>
    </main>
  );
}
