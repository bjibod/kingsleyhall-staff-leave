type MonitoringEvent = {
  request?: { data?: unknown; cookies?: unknown; headers?: Record<string, unknown>; [key: string]: unknown };
  user?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  contexts?: Record<string, unknown>;
  breadcrumbs?: Array<{ data?: Record<string, unknown>; [key: string]: unknown }>;
  [key: string]: unknown;
};

export function sanitizeMonitoringEvent<T extends object>(input: T): T {
  const event = input as MonitoringEvent;
  if (event.request) {
    const rawUrl = typeof event.request.url === "string" ? event.request.url : undefined;
    let safeUrl = rawUrl?.split(/[?#]/, 1)[0];
    try { if (rawUrl) { const parsed = new URL(rawUrl); safeUrl = `${parsed.origin}${parsed.pathname}`; } } catch { /* relative URLs are handled above */ }
    event.request = { method: event.request.method, url: safeUrl };
  }
  event.user = undefined;
  event.extra = undefined;
  if (event.contexts) event.contexts = Object.fromEntries(Object.entries(event.contexts).filter(([key]) => ["trace", "runtime", "os", "browser", "device", "app", "cloud_resource"].includes(key)));
  event.breadcrumbs = event.breadcrumbs?.map(breadcrumb => ({ ...breadcrumb, data: undefined }));
  return input;
}

export function monitoringEnvironment(env: NodeJS.ProcessEnv = process.env) { return env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? env.SENTRY_ENVIRONMENT ?? env.DEPLOYMENT_ENV ?? env.VERCEL_ENV ?? "development"; }
export function monitoringRelease(env: NodeJS.ProcessEnv = process.env) { return env.NEXT_PUBLIC_SENTRY_RELEASE ?? env.SENTRY_RELEASE ?? env.RELEASE_SHA ?? env.VERCEL_GIT_COMMIT_SHA ?? "local"; }
export function monitoringTraceRate(env: NodeJS.ProcessEnv = process.env) {
  const parsed = Number(env.SENTRY_TRACES_SAMPLE_RATE ?? (monitoringEnvironment(env) === "production" ? "0.1" : "0.2"));
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 0;
}
