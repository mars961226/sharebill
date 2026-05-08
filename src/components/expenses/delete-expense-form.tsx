"use client";

import { deleteExpenseAction } from "@/server/expenses/actions";

export function DeleteExpenseForm({
  bookId,
  expenseId,
  expenseTitle,
}: {
  bookId: string;
  expenseId: string;
  expenseTitle: string;
}) {
  return (
    <form
      action={deleteExpenseAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Delete expense "${expenseTitle}"? This cannot be undone.`,
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input name="bookId" type="hidden" value={bookId} />
      <input name="expenseId" type="hidden" value={expenseId} />
      <button className="button danger small" type="submit">
        Delete
      </button>
    </form>
  );
}
