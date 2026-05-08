"use client";

import { useActionState } from "react";
import { joinBookAction, type BookActionState } from "@/server/books/actions";

const initialState: BookActionState = {};

export type JoinPlaceholderOption = {
  id: string;
  displayName: string;
};

export function JoinBookForm({
  inviteCode,
  placeholderOptions,
}: {
  inviteCode?: string;
  placeholderOptions?: JoinPlaceholderOption[];
}) {
  const [state, formAction, isPending] = useActionState(
    joinBookAction,
    initialState,
  );
  const hasPlaceholderOptions =
    placeholderOptions !== undefined && placeholderOptions.length > 0;

  return (
    <form
      action={formAction}
      className="panel"
      onSubmit={(event) => {
        const formData = new FormData(event.currentTarget);
        const submittedInviteCode = String(formData.get("inviteCode") ?? "")
          .trim()
          .toUpperCase();
        const loadedInviteCode = inviteCode?.trim().toUpperCase();
        const joinMode = formData.get("joinMode");

        if (
          submittedInviteCode.length > 0 &&
          submittedInviteCode !== loadedInviteCode
        ) {
          event.preventDefault();
          window.location.href = `/join?code=${encodeURIComponent(
            submittedInviteCode,
          )}`;
          return;
        }

        if (typeof joinMode === "string" && joinMode.startsWith("CLAIM:")) {
          const placeholderMemberId = joinMode.slice("CLAIM:".length);
          const selectedPlaceholder = placeholderOptions?.find(
            (placeholder) => placeholder.id === placeholderMemberId,
          );
          const confirmed = window.confirm(
            `Claim temporary member "${selectedPlaceholder?.displayName ?? "this member"}"? Their expenses and balances will be merged into your account. This cannot be undone.`,
          );

          if (!confirmed) {
            event.preventDefault();
          }
        }
      }}
    >
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
      {hasPlaceholderOptions ? (
        <fieldset>
          <legend>Join identity</legend>
          <div className="option-list">
            <label className="checkbox-label">
              <input name="joinMode" required type="radio" value="SELF" />
              <span>Join as myself</span>
            </label>
            {placeholderOptions.map((placeholder) => (
              <label className="checkbox-label" key={placeholder.id}>
                <input
                  name="joinMode"
                  required
                  type="radio"
                  value={`CLAIM:${placeholder.id}`}
                />
                <span>Claim temporary member {placeholder.displayName}</span>
              </label>
            ))}
          </div>
          <p className="field-help">
            Choose one option. Claiming a temporary member cannot be undone.
          </p>
        </fieldset>
      ) : null}
      <button className="button primary" disabled={isPending} type="submit">
        {isPending ? "Joining..." : "Join book"}
      </button>
    </form>
  );
}
