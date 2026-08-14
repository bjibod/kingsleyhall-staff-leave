import Image from "next/image";
import { logout } from "@/features/auth/actions";

export function AppShell({ children, roles = [] }: { children: React.ReactNode; roles?: string[] }) {
  const manager = roles.some((role) => ["MANAGER", "HR_ADMIN", "SUPER_ADMIN"].includes(role));
  const admin = roles.some((role) => ["HR_ADMIN", "SUPER_ADMIN"].includes(role));
  return <>
    <div className="brand-strip"><span>It all adds up to Kingsley Hall</span><strong>Staff portal</strong></div>
    <header className="app-header">
      <div className="brand">
        <Image src="/kingsley-hall-logo.png" alt="Kingsley Hall" width={162} height={38} priority />
        <span className="brand-divider" />
        <span className="portal-name"><strong>Staff Leave</strong><small>Helping Communities Live Well</small></span>
      </div>
      <nav className="nav" aria-label="Main navigation">
        <a href="/dashboard">Home</a><a href="/leave">My leave</a><a href="/calendar">Team calendar</a><a href="/notifications">Notifications</a>
        {manager && <a href="/manager">Manager</a>}{admin && <a href="/admin">Admin</a>}
      </nav>
      <form action={logout}><button className="signout" type="submit">Sign out</button></form>
    </header>
    {children}
  </>;
}
