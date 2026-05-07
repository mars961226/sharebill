import Link from "next/link";
import { notFound } from "next/navigation";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { formatEuro } from "@/lib/money";
import { canDeleteExpense } from "@/lib/permissions";
import { requireCurrentUser } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { deleteExpenseAction } from "@/server/expenses/actions";

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
          <Link className="button secondary" href={`/books/${bookId}`}>
            Overview
          </Link>
          <Link className="button secondary" href={`/books/${bookId}/members`}>
            Members
          </Link>
        </div>
      </header>

      <nav className="tab-nav" aria-label="Book navigation">
        <Link className="tab-link" href={`/books/${bookId}`}>
          Overview
        </Link>
        <Link className="tab-link active" href={`/books/${bookId}/expenses`}>
          Expenses
        </Link>
        <Link className="tab-link" href={`/books/${bookId}/members`}>
          Members
        </Link>
      </nav>

      <section className="two-column wide-left">
        <div className="section-block">
          <p className="eyebrow">Expense history</p>
          {currentMember.book.expenses.length > 0 ? (
            <div className="expense-list">
              {currentMember.book.expenses.map((expense) => {
                const canDelete = canDeleteExpense(
                  currentMember,
                  expense.createdById,
                );

                return (
                  <article className="expense-item" key={expense.id}>
                    <div className="expense-item-main">
                      <div>
                        <h2>{expense.title}</h2>
                        <p className="muted">
                          {expense.expenseDate.toLocaleDateString("en-GB")} · paid
                          by {expense.payer.displayName} · added by{" "}
                          {expense.createdBy.displayName}
                        </p>
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
                    <div className="row-actions">
                      <Link
                        className="button secondary small"
                        href={`/books/${bookId}/expenses/${expense.id}/edit`}
                      >
                        Edit
                      </Link>
                      {canDelete ? (
                        <form action={deleteExpenseAction}>
                          <input name="bookId" type="hidden" value={bookId} />
                          <input
                            name="expenseId"
                            type="hidden"
                            value={expense.id}
                          />
                          <button className="button danger small" type="submit">
                            Delete
                          </button>
                        </form>
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

        <div className="form-section inline-form-section">
          <ExpenseForm
            bookId={bookId}
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
