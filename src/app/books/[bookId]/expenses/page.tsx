import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteExpenseForm } from "@/components/expenses/delete-expense-form";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { formatEuro } from "@/lib/money";
import { canDeleteExpense } from "@/lib/permissions";
import { requireCurrentUser } from "@/server/auth/session";
import { prisma } from "@/server/db";
import {
  getExpenseLockSnapshot,
  isExpenseLocked,
  LOCKED_EXPENSE_MESSAGE,
} from "@/server/expenses/locks";

export default async function BookExpensesPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const user = await requireCurrentUser();
  const { bookId } = await params;

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
          expenses: {
            orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
            include: {
              payer: true,
              createdBy: true,
              participants: {
                include: {
                  member: true,
                },
                orderBy: {
                  memberId: "asc",
                },
              },
            },
          },
        },
      },
    },
  });

  if (!currentMember) {
    notFound();
  }

  const lockSnapshot = await getExpenseLockSnapshot(bookId);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Expenses</p>
          <h1>{currentMember.book.name}</h1>
          <p className="muted">
            {currentMember.book.expenses.length} recorded · EUR
          </p>
        </div>
        <div className="topbar-actions">
          <Link className="button secondary" href="/books">
            Back to books
          </Link>
        </div>
      </header>

      <nav className="tab-nav" aria-label="Book navigation">
        <Link className="tab-link" href={`/books/${bookId}`}>
          Overview
        </Link>
        <Link
          className="tab-link tab-link-primary active"
          href={`/books/${bookId}/expenses`}
        >
          Add expense
        </Link>
        <Link className="tab-link" href={`/books/${bookId}/members`}>
          Members
        </Link>
      </nav>

      <section className="two-column wide-left">
        <div className="section-block expense-history-section">
          <p className="eyebrow">Expense history</p>
          {currentMember.book.expenses.length > 0 ? (
            <div className="expense-list">
              {currentMember.book.expenses.map((expense) => {
                const canDelete = canDeleteExpense(
                  currentMember,
                  expense.createdById,
                );
                const isLocked = isExpenseLocked(expense, lockSnapshot);

                return (
                  <article className="expense-item" key={expense.id}>
                    <div className="expense-item-main">
                      <div>
                        <h2>{expense.title}</h2>
                        <dl className="meta-grid">
                          <div>
                            <dt>Spent</dt>
                            <dd>{expense.expenseDate.toLocaleDateString("en-GB")}</dd>
                          </div>
                          <div>
                            <dt>Added</dt>
                            <dd>{expense.createdAt.toLocaleDateString("en-GB")}</dd>
                          </div>
                          <div>
                            <dt>Paid by</dt>
                            <dd>{expense.payer.displayName}</dd>
                          </div>
                          <div>
                            <dt>Added by</dt>
                            <dd>{expense.createdBy.displayName}</dd>
                          </div>
                        </dl>
                      </div>
                      <strong>{formatEuro(expense.amountCents)}</strong>
                    </div>
                    <div className="split-list">
                      {expense.participants.map((participant) => (
                        <span key={participant.id}>
                          {participant.member.displayName}:{" "}
                          {formatEuro(participant.owedAmountCents)}
                        </span>
                      ))}
                    </div>
                    {isLocked ? (
                      <p className="field-help">{LOCKED_EXPENSE_MESSAGE}</p>
                    ) : null}
                    <div className="row-actions">
                      {isLocked ? (
                        <button
                          className="button secondary small"
                          disabled
                          title={LOCKED_EXPENSE_MESSAGE}
                          type="button"
                        >
                          Edit
                        </button>
                      ) : (
                        <Link
                          className="button secondary small"
                          href={`/books/${bookId}/expenses/${expense.id}/edit`}
                        >
                          Edit
                        </Link>
                      )}
                      {canDelete ? (
                        isLocked ? (
                          <button
                            className="button danger small"
                            disabled
                            title={LOCKED_EXPENSE_MESSAGE}
                            type="button"
                          >
                            Delete
                          </button>
                        ) : (
                          <DeleteExpenseForm
                            bookId={bookId}
                            expenseId={expense.id}
                            expenseTitle={expense.title}
                          />
                        )
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="muted">
              Add the first expense to start calculating balances.
            </p>
          )}
        </div>

        <div className="form-section inline-form-section expense-form-section">
          <ExpenseForm
            bookId={bookId}
            defaultPayerMemberId={currentMember.id}
            members={currentMember.book.members.map((member) => ({
              id: member.id,
              displayName: member.displayName,
              type: member.type,
            }))}
          />
        </div>
      </section>
    </main>
  );
}
