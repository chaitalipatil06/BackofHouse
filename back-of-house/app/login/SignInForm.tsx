"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "@/app/actions";

export function SignInForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});
  return (
    <form action={action} className="stack" noValidate>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" className="input" required aria-describedby={state.error ? "signin-error" : undefined} />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" className="input" required />
      </div>
      {state.error && <p id="signin-error" role="alert" className="note" style={{ background: "var(--blush)", color: "var(--danger)" }}>{state.error}</p>}
      <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      <p className="muted small">Forgot your password? Ask your manager to reset it.</p>
    </form>
  );
}
