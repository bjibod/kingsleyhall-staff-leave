import * as Sentry from "@sentry/nextjs";
import { monitoringEnvironment, monitoringRelease, monitoringTraceRate, sanitizeMonitoringEvent } from "./src/lib/monitoring-privacy";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: monitoringEnvironment(),
  release: monitoringRelease(),
  sendDefaultPii: false,
  tracesSampleRate: monitoringTraceRate(),
  beforeSend: sanitizeMonitoringEvent,
  maxBreadcrumbs: 30
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
