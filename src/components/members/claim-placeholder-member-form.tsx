"use client";

import { claimPlaceholderMemberAction } from "@/server/members/actions";

export function ClaimPlaceholderMemberForm({
  bookId,
  memberId,
  displayName,
}: {
  bookId: string;
  memberId: string;
  displayName: string;
}) {
  return (
    <form
      action={claimPlaceholderMemberAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Claim temporary member "${displayName}"? Their expenses and balances will be merged into your account. This cannot be undone.`,
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input name="bookId" type="hidden" value={bookId} />
      <input name="memberId" type="hidden" value={memberId} />
      <button className="button secondary small" type="submit">
        Claim
      </button>
    </form>
  );
}
