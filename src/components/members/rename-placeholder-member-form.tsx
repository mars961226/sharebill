"use client";

import { useActionState } from "react";
import {
  renamePlaceholderMemberAction,
  type MemberActionState,
} from "@/server/members/actions";

const initialState: MemberActionState = {};

export function RenamePlaceholderMemberForm({
  bookId,
  memberId,
  displayName,
}: {
  bookId: string;
  memberId: string;
  displayName: string;
}) {
  const [state, formAction, isPending] = useActionState(
    renamePlaceholderMemberAction,
    initialState,
  );

  return (
    <form action={formAction} className="rename-member-form">
      <input name="bookId" type="hidden" value={bookId} />
      <input name="memberId" type="hidden" value={memberId} />
      <input
        aria-label={`Rename temporary member ${displayName}`}
        defaultValue={displayName}
        name="displayName"
        placeholder="Alex"
        type="text"
      />
      {state.error ? <p className="alert error">{state.error}</p> : null}
      {state.success ? <p className="alert success">{state.success}</p> : null}
      <button className="button secondary small" disabled={isPending} type="submit">
        {isPending ? "Saving..." : "Rename"}
      </button>
    </form>
  );
}
