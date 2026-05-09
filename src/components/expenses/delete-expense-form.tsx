"use client";

import { useActionState } from "react";
import {
  deleteExpenseAction,
  type ExpenseActionState,
} from "@/server/expenses/actions";

const initialState: ExpenseActionState = {};

export function DeleteExpenseForm({
  bookId,
  expenseId,
  expenseTitle,
}: {
  bookId: string;
  expenseId: string;
  expenseTitle: string;
}) {
  const [state, formAction, isPending] = useActionState(
    deleteExpenseAction,
    initialState,
  );

  return (
    <form
      action={formAction}
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
      {state.error ? <p className="alert error">{state.error}</p> : null}
      <button className="button danger small" disabled={isPending} type="submit">
        {isPending ? "Deleting..." : "Delete"}
      </button>
    </form>
  );
}
