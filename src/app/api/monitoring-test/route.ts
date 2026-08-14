import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { monitoringEnvironment, monitoringRelease, monitoringTraceRate, sanitizeMonitoringEvent } from "@/lib/monitoring-privacy";
import { monitoringTestAuthorised } from "@/lib/monitoring-test";

export const dynamic = "force-dynamic";

function ensureMonitoringClient() {
  if (Sentry.getClient() || !process.env.SENTRY_DSN) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    enabled: true,
    environment: monitoringEnvironment(),
    release: monitoringRelease(),
    sendDefaultPii: false,
    tracesSampleRate: monitoringTraceRate(),
    beforeSend: sanitizeMonitoringEvent,
    maxBreadcrumbs: 30
  });
}

export async function POST(request: NextRequest) {
  if (!monitoringTestAuthorised(process.env, request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: { "cache-control": "no-store" } });
  }

  ensureMonitoringClient();
  if (!Sentry.getClient()) {
    return NextResponse.json(
      { status: "monitoring_unavailable" },
      { status: 503, headers: { "cache-control": "no-store" } }
    );
  }

  Sentry.captureException(new Error("Controlled staging Sentry verification"), {
    tags: { operation: "monitoring_verification", synthetic: "true" }
  });
  const delivered = await Sentry.flush(5_000);

  return NextResponse.json(
    { status: delivered ? "captured" : "delivery_timeout" },
    { status: delivered ? 202 : 503, headers: { "cache-control": "no-store" } }
  );
}
