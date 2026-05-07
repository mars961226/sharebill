"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  type AuthActionState,
  registerAction,
} from "@/server/auth/actions";

const initialState: AuthActionState = {};

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState,
  );

  return (
    <form action={formAction} className="panel">
      <div>
        <p className="eyebrow">Get started</p>
        <h1>Create account</h1>
      </div>
      {state.error ? <p className="alert error">{state.error}</p> : null}
      <label>
        Display name
        <input name="displayName" placeholder="Alex" type="text" />
      </label>
      <label>
        Email
        <input name="email" placeholder="alex@example.com" type="email" />
      </label>
      <label>
        Password
        <input name="password" minLength={8} type="password" />
      </label>
      <button className="button primary" disabled={isPending} type="submit">
        {isPending ? "Creating..." : "Register"}
      </button>
      <p className="muted">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </form>
  );
}
