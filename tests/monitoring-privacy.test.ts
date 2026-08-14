import { describe, expect, it } from "vitest";
import { monitoringEnvironment, monitoringRelease, monitoringTraceRate, sanitizeMonitoringEvent } from "@/lib/monitoring-privacy";

describe("monitoring privacy", () => {
  it("removes bodies, cookies, headers, users and token query strings", () => {
    const event = sanitizeMonitoringEvent({
      request: { method: "POST", url: "https://leave.example.org/reset-password?token=secret-token", data: { password: "secret" }, cookies: { session: "secret" }, headers: { authorization: "Bearer secret" } },
      user: { id: "user-1", email: "person@example.org" }, extra: { employeeName: "Person", token: "secret" },
      breadcrumbs: [{ category: "form", data: { email: "person@example.org" } }]
    });
    expect(event.request).toEqual({ method: "POST", url: "https://leave.example.org/reset-password" });
    expect(event.user).toBeUndefined(); expect(event.extra).toBeUndefined(); expect(event.breadcrumbs?.[0].data).toBeUndefined();
    expect(JSON.stringify(event)).not.toContain("secret"); expect(JSON.stringify(event)).not.toContain("person@example.org");
  });
  it("separates environment and release tags", () => {
    const env = { NODE_ENV: "production", SENTRY_ENVIRONMENT: "staging", SENTRY_RELEASE: "abc123" } as NodeJS.ProcessEnv;
    expect(monitoringEnvironment(env)).toBe("staging"); expect(monitoringRelease(env)).toBe("abc123");
  });
  it("bounds invalid sampling values to zero", () => {
    expect(monitoringTraceRate({ NODE_ENV: "production", SENTRY_TRACES_SAMPLE_RATE: "2" } as NodeJS.ProcessEnv)).toBe(0);
    expect(monitoringTraceRate({ NODE_ENV: "production", DEPLOYMENT_ENV: "production" } as NodeJS.ProcessEnv)).toBe(0.1);
  });
});
