import * as Sentry from "@sentry/nextjs";
import { monitoringEnvironment, monitoringRelease, monitoringTraceRate, sanitizeMonitoringEvent } from "./src/lib/monitoring-privacy";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  environment: monitoringEnvironment(),
  release: monitoringRelease(),
  sendDefaultPii: false,
  tracesSampleRate: monitoringTraceRate(),
  beforeSend: sanitizeMonitoringEvent,
  maxBreadcrumbs: 30
});
