"use client";

import { useActionState } from "react";
import { requestPasswordReset, resetPassword } from "@/features/auth/password-reset-actions";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, {});
  return <form action={action} className="form-stack">
    <label>Work email<input name="email" type="email" autoComplete="email" required /></label>
    {state.error && <p className="error" role="alert">{state.error}</p>}
    {state.success && <p className="success" role="status">{state.success}</p>}
    <button disabled={pending} type="submit">{pending ? "Sending..." : "Send reset link"}</button>
    <a href="/login">Return to sign in</a>
  </form>;
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, {});
  return <form action={action} className="form-stack">
    <input name="token" type="hidden" value={token} />
    <label>New password<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
    <label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
    {state.error && <p className="error" role="alert">{state.error}</p>}
    {state.success && <p className="success" role="status">{state.success}</p>}
    <button disabled={pending || !token} type="submit">{pending ? "Changing..." : "Change password"}</button>
    <a href="/login">Return to sign in</a>
  </form>;
}
