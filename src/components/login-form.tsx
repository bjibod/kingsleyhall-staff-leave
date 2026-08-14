"use client";

import { useActionState } from "react";
import { login } from "@/features/auth/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, { error: undefined });
  return <form action={action} className="form-stack">
    <label>Work email<input name="email" type="email" autoComplete="email" required /></label>
    <label>Password<input name="password" type="password" autoComplete="current-password" minLength={8} required /></label>
    {state.error && <p className="error" role="alert">{state.error}</p>}
    <button disabled={pending} type="submit">{pending ? "Signing in…" : "Sign in"}</button>
    <a href="/forgot-password">Forgot password?</a>
  </form>;
}
