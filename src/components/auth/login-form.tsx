"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthActionState } from "@/server/auth/actions";

const initialState: AuthActionState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="panel">
      <div>
        <p className="eyebrow">Welcome back</p>
        <h1>Log in</h1>
      </div>
      {state.error ? <p className="alert error">{state.error}</p> : null}
      <label>
        Email
        <input name="email" placeholder="alex@example.com" type="email" />
      </label>
      <label>
        Password
        <input name="password" type="password" />
      </label>
      <button className="button primary" disabled={isPending} type="submit">
        {isPending ? "Logging in..." : "Log in"}
      </button>
      <p className="muted">
        Need an account? <Link href="/register">Register</Link>
      </p>
      <p className="muted">
        <Link href="/forgot-password">Forgot password?</Link>
      </p>
    </form>
  );
}
