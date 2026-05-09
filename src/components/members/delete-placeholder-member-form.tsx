"use client";

import { useActionState } from "react";
import {
  deletePlaceholderMemberAction,
  type MemberActionState,
} from "@/server/members/actions";

const initialState: MemberActionState = {};

export function DeletePlaceholderMemberForm({
  bookId,
  memberId,
  displayName,
}: {
  bookId: string;
  memberId: string;
  displayName: string;
}) {
  const [state, formAction, isPending] = useActionState(
    deletePlaceholderMemberAction,
    initialState,
  );

  return (
    <form
      action={formAction}
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
      {state.error ? <p className="alert error">{state.error}</p> : null}
      <button className="button danger small" disabled={isPending} type="submit">
        {isPending ? "Deleting..." : "Delete"}
      </button>
    </form>
  );
}
