import { ActivationForm } from "@/components/activation-form";

export default async function ActivateAccountPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <main className="auth-shell"><section className="auth-card"><p className="eyebrow">Kingsley Hall Staff Leave</p><h1>Activate your account</h1><p className="subtitle">Create a password of at least 12 characters. This invitation works once and expires after 72 hours.</p>{token ? <ActivationForm token={token} /> : <><p className="error" role="alert">This invitation link is incomplete.</p><p>Ask your administrator to resend it.</p></>}</section></main>;
}
