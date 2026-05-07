"use client";

import { useActionState } from "react";
import { joinBookAction, type BookActionState } from "@/server/books/actions";

const initialState: BookActionState = {};

export function JoinBookForm({ inviteCode }: { inviteCode?: string }) {
  const [state, formAction, isPending] = useActionState(
    joinBookAction,
    initialState,
  );

  return (
    <form action={formAction} className="panel">
      <div>
        <p className="eyebrow">Invite</p>
        <h1>Join book</h1>
      </div>
      {state.error ? <p className="alert error">{state.error}</p> : null}
      <label>
        Invite code
        <input
          defaultValue={inviteCode}
          name="inviteCode"
          placeholder="ABC123"
          type="text"
        />
      </label>
      <button className="button primary" disabled={isPending} type="submit">
        {isPending ? "Joining..." : "Join book"}
      </button>
    </form>
  );
}
