"use client";

import { useActionState } from "react";
import {
  confirmSettlementAction,
  type SettlementActionState,
} from "@/server/settlements/actions";

const initialState: SettlementActionState = {};

export function ConfirmSettlementForm({
  bookId,
  payerMemberId,
  receiverMemberId,
  amountCents,
  payerName,
  receiverName,
  amountLabel,
}: {
  bookId: string;
  payerMemberId: string;
  receiverMemberId: string;
  amountCents: number;
  payerName: string;
  receiverName: string;
  amountLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(
    confirmSettlementAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Confirm settlement: ${payerName} pays ${receiverName} ${amountLabel}? This cannot be undone.`,
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input name="bookId" type="hidden" value={bookId} />
      <input name="payerMemberId" type="hidden" value={payerMemberId} />
      <input name="receiverMemberId" type="hidden" value={receiverMemberId} />
      <input name="amountCents" type="hidden" value={amountCents} />
      {state.error ? <p className="alert error">{state.error}</p> : null}
      <button className="button primary small" disabled={isPending} type="submit">
        {isPending ? "Confirming..." : "Confirm"}
      </button>
    </form>
  );
}
