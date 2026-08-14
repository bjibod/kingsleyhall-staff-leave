import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", environment: process.env.DEPLOYMENT_ENV ?? process.env.VERCEL_ENV ?? "unknown", release: process.env.RELEASE_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "unknown" }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ status: "unhealthy", environment: process.env.DEPLOYMENT_ENV ?? process.env.VERCEL_ENV ?? "unknown" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
