"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error); }, [error]);
  return <html lang="en"><body><main className="auth-shell"><section className="auth-card"><p className="eyebrow">Kingsley Hall Staff Leave</p><h1>Something went wrong</h1><p className="subtitle">The problem has been recorded. Please try again, or contact support if it continues.</p><button type="button" onClick={reset}>Try again</button></section></main></body></html>;
}
