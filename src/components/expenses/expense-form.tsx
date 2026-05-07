"use client";

import { useActionState } from "react";
import {
  createExpenseAction,
  updateExpenseAction,
  type ExpenseActionState,
} from "@/server/expenses/actions";

export type ExpenseFormMember = {
  id: string;
  displayName: string;
  type: "REAL" | "PLACEHOLDER";
};

export type ExpenseFormInitialValue = {
  id: string;
  title: string;
  expenseDate: string;
  amount: string;
  payerMemberId: string;
  splitMethod: "EQUAL" | "CUSTOM";
  participants: Array<{
    memberId: string;
    amount: string;
  }>;
};

const initialState: ExpenseActionState = {};

export function ExpenseForm({
  bookId,
  members,
  initialValue,
}: {
  bookId: string;
  members: ExpenseFormMember[];
  initialValue?: ExpenseFormInitialValue;
}) {
  const action = initialValue ? updateExpenseAction : createExpenseAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const selectedParticipants = new Set(
    initialValue?.participants.map((participant) => participant.memberId) ??
      members.map((member) => member.id),
  );
  const customAmounts = new Map(
    initialValue?.participants.map((participant) => [
      participant.memberId,
      participant.amount,
    ]) ?? [],
  );

  return (
    <form action={formAction} className="panel compact-panel expense-form">
      <div>
        <p className="eyebrow">Expense</p>
        <h2>{initialValue ? "Edit expense" : "Add expense"}</h2>
      </div>

      {state.error ? <p className="alert error">{state.error}</p> : null}

      <input name="bookId" type="hidden" value={bookId} />
      {initialValue ? (
        <input name="expenseId" type="hidden" value={initialValue.id} />
      ) : null}

      <div className="form-grid">
        <label>
          Reason
          <input
            defaultValue={initialValue?.title}
            name="title"
            placeholder="Dinner"
            type="text"
          />
        </label>

        <label>
          Date
          <input
            defaultValue={initialValue?.expenseDate ?? todayInputValue()}
            name="expenseDate"
            type="date"
          />
        </label>

        <label>
          Amount
          <input
            defaultValue={initialValue?.amount}
            inputMode="decimal"
            name="amount"
            placeholder="24.50"
            type="text"
          />
        </label>

        <label>
          Paid by
          <select defaultValue={initialValue?.payerMemberId} name="payerMemberId">
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.displayName}
                {member.type === "PLACEHOLDER" ? " (temporary)" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset>
        <legend>Split method</legend>
        <div className="segmented-control">
          <label>
            <input
              defaultChecked={!initialValue || initialValue.splitMethod === "EQUAL"}
              name="splitMethod"
              type="radio"
              value="EQUAL"
            />
            Equal
          </label>
          <label>
            <input
              defaultChecked={initialValue?.splitMethod === "CUSTOM"}
              name="splitMethod"
              type="radio"
              value="CUSTOM"
            />
            Custom
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Participants</legend>
        <div className="participant-grid">
          {members.map((member) => (
            <div className="participant-row" key={member.id}>
              <label className="checkbox-label">
                <input
                  defaultChecked={selectedParticipants.has(member.id)}
                  name="participantMemberIds"
                  type="checkbox"
                  value={member.id}
                />
                <span>
                  {member.displayName}
                  {member.type === "PLACEHOLDER" ? " (temporary)" : ""}
                </span>
              </label>
              <input
                aria-label={`Custom split amount for ${member.displayName}`}
                defaultValue={customAmounts.get(member.id) ?? ""}
                inputMode="decimal"
                name={`customAmount:${member.id}`}
                placeholder="Custom"
                type="text"
              />
            </div>
          ))}
        </div>
        <p className="field-help">
          Custom amounts are used only when Custom split is selected.
        </p>
      </fieldset>

      <button className="button primary" disabled={isPending} type="submit">
        {isPending
          ? initialValue
            ? "Saving..."
            : "Adding..."
          : initialValue
            ? "Save expense"
            : "Add expense"}
      </button>
    </form>
  );
}

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}
