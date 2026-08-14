import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { monitoringTestAuthorised } from "@/lib/monitoring-test";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!monitoringTestAuthorised(process.env, request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: { "cache-control": "no-store" } });
  }

  Sentry.captureException(new Error("Controlled staging Sentry verification"), {
    tags: { operation: "monitoring_verification", synthetic: "true" }
  });
  const delivered = await Sentry.flush(2_000);

  return NextResponse.json(
    { status: delivered ? "captured" : "delivery_timeout" },
    { status: delivered ? 202 : 503, headers: { "cache-control": "no-store" } }
  );
}
