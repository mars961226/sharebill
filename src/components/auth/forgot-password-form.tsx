"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  type AuthActionState,
  forgotPasswordAction,
} from "@/server/auth/actions";

const initialState: AuthActionState = {};

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    forgotPasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="panel">
      <div>
        <p className="eyebrow">Account help</p>
        <h1>Reset password</h1>
      </div>
      {state.error ? <p className="alert error">{state.error}</p> : null}
      {state.success ? <p className="alert success">{state.success}</p> : null}
      <label>
        Email
        <input name="email" placeholder="alex@example.com" type="email" />
      </label>
      <button className="button primary" disabled={isPending} type="submit">
        {isPending ? "Sending..." : "Send reset link"}
      </button>
      <p className="muted">
        Remembered it? <Link href="/login">Log in</Link>
      </p>
    </form>
  );
}
