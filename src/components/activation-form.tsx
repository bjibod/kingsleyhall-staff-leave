"use client";

import { useActionState } from "react";
import { activateAccount } from "@/features/auth/activation-actions";

export function ActivationForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(activateAccount, {});
  return <form action={action} className="form-stack">
    <input type="hidden" name="token" value={token} />
    <label>Create password<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
    <label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
    {state.error && <p className="error" role="alert">{state.error}</p>}
    {state.success && <p role="status">{state.success}</p>}
    <button type="submit" disabled={pending}>{pending ? "Activating..." : "Activate account"}</button>
    {state.success && <a href="/login">Continue to sign in</a>}
  </form>;
}
