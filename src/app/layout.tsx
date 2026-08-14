import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = { title: "Kingsley Hall Staff Leave", description: "Holiday & Leave Management" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
