import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = { title: "Kingsley Hall Staff Leave", description: "Holiday & Leave Management" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const staging = process.env.DEPLOYMENT_ENV === "staging";
  const bannerStyle = { position: "sticky", top: 0, zIndex: 1000, padding: "8px 16px", textAlign: "center", background: "#6f2dbd", color: "white", fontSize: ".78rem", fontWeight: 800, letterSpacing: ".08em" } as const;
  return <html lang="en"><head>{staging && <meta name="robots" content="noindex,nofollow,noarchive" />}</head><body>{staging && <div style={bannerStyle} role="status">STAGING — fictional test data only — not the live staff system</div>}{children}</body></html>;
}
