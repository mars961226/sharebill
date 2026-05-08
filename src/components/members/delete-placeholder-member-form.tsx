"use client";

import { deletePlaceholderMemberAction } from "@/server/members/actions";

export function DeletePlaceholderMemberForm({
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
      action={deletePlaceholderMemberAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Delete temporary member "${displayName}"? This cannot be undone.`,
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input name="bookId" type="hidden" value={bookId} />
      <input name="memberId" type="hidden" value={memberId} />
      <button className="button danger small" type="submit">
        Delete
      </button>
    </form>
  );
}
