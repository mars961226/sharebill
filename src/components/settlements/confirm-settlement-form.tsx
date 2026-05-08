"use client";

import { confirmSettlementAction } from "@/server/settlements/actions";

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
  return (
    <form
      action={confirmSettlementAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Confirm settlement: ${payerName} pays ${receiverName} ${amountLabel}? This cannot be undone in the MVP.`,
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
      <button className="button primary small" type="submit">
        Confirm
      </button>
    </form>
  );
}
