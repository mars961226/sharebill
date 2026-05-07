"use client";

import { useActionState } from "react";
import {
  createBookAction,
  type BookActionState,
} from "@/server/books/actions";

const initialState: BookActionState = {};

export function CreateBookForm() {
  const [state, formAction, isPending] = useActionState(
    createBookAction,
    initialState,
  );

  return (
    <form action={formAction} className="panel">
      <div>
        <p className="eyebrow">New book</p>
        <h1>Create book</h1>
      </div>
      {state.error ? <p className="alert error">{state.error}</p> : null}
      <label>
        Book name
        <input name="name" placeholder="Berlin weekend" type="text" />
      </label>
      <button className="button primary" disabled={isPending} type="submit">
        {isPending ? "Creating..." : "Create book"}
      </button>
    </form>
  );
}
