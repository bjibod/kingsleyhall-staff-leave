import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/features/auth/session";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return <main className="auth-shell"><section className="auth-card" aria-labelledby="login-title">
    <p className="eyebrow">Kingsley Hall Staff Leave</p><h1 id="login-title">Welcome back</h1><p className="subtitle">Holiday &amp; Leave Management</p><LoginForm />
  </section></main>;
}
