"use client";

import { useActionState } from "react";
import {
  createPlaceholderMemberAction,
  type MemberActionState,
} from "@/server/members/actions";

const initialState: MemberActionState = {};

export function CreatePlaceholderMemberForm({ bookId }: { bookId: string }) {
  const [state, formAction, isPending] = useActionState(
    createPlaceholderMemberAction,
    initialState,
  );

  return (
    <form action={formAction} className="panel compact-panel">
      <div>
        <p className="eyebrow">Temporary member</p>
        <h2>Add member</h2>
      </div>
      {state.error ? <p className="alert error">{state.error}</p> : null}
      {state.success ? <p className="alert success">{state.success}</p> : null}
      <input name="bookId" type="hidden" value={bookId} />
      <label>
        Display name
        <input name="displayName" placeholder="Alex" type="text" />
      </label>
      <button className="button primary" disabled={isPending} type="submit">
        {isPending ? "Adding..." : "Add temporary member"}
      </button>
    </form>
  );
}
