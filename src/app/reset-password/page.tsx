import { ResetPasswordForm } from "@/components/password-reset-forms";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <main className="auth-shell"><section className="auth-card"><p className="eyebrow">Kingsley Hall Staff Leave</p><h1>Choose a new password</h1><p className="subtitle">Use at least 12 characters. Reset links expire after 30 minutes and work once.</p>{token ? <ResetPasswordForm token={token} /> : <><p className="error" role="alert">This reset link is incomplete.</p><a href="/forgot-password">Request a new link</a></>}</section></main>;
}
