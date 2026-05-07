"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  type AuthActionState,
  resetPasswordAction,
} from "@/server/auth/actions";

const initialState: AuthActionState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(
    resetPasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="panel">
      <div>
        <p className="eyebrow">Account help</p>
        <h1>Choose new password</h1>
      </div>
      {state.error ? <p className="alert error">{state.error}</p> : null}
      {state.success ? <p className="alert success">{state.success}</p> : null}
      <input name="token" type="hidden" value={token} />
      <label>
        New password
        <input name="password" minLength={8} type="password" />
      </label>
      <button className="button primary" disabled={isPending} type="submit">
        {isPending ? "Saving..." : "Reset password"}
      </button>
      {state.success ? (
        <p className="muted">
          <Link href="/login">Go to login</Link>
        </p>
      ) : null}
    </form>
  );
}
