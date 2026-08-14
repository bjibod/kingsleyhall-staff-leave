import { ForgotPasswordForm } from "@/components/password-reset-forms";

export default function ForgotPasswordPage() {
  return <main className="auth-shell"><section className="auth-card"><p className="eyebrow">Kingsley Hall Staff Leave</p><h1>Reset your password</h1><p className="subtitle">Enter your work email. If it matches an active account, we will send a one-time link.</p><ForgotPasswordForm /></section></main>;
}
