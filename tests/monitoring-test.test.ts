import { describe, expect, it } from "vitest";
import { monitoringTestAuthorised } from "@/lib/monitoring-test";

const secret = "staging-monitoring-secret-at-least-32-characters";

describe("monitoring test authorization", () => {
  it("accepts the configured bearer secret in staging", () => {
    expect(monitoringTestAuthorised({ DEPLOYMENT_ENV: "staging", MONITORING_TEST_SECRET: secret }, `Bearer ${secret}`)).toBe(true);
  });

  it("is unavailable outside staging", () => {
    expect(monitoringTestAuthorised({ DEPLOYMENT_ENV: "production", MONITORING_TEST_SECRET: secret }, `Bearer ${secret}`)).toBe(false);
  });

  it("rejects missing, short, and incorrect secrets", () => {
    expect(monitoringTestAuthorised({ DEPLOYMENT_ENV: "staging" }, `Bearer ${secret}`)).toBe(false);
    expect(monitoringTestAuthorised({ DEPLOYMENT_ENV: "staging", MONITORING_TEST_SECRET: "short" }, "Bearer short")).toBe(false);
    expect(monitoringTestAuthorised({ DEPLOYMENT_ENV: "staging", MONITORING_TEST_SECRET: secret }, "Bearer incorrect")).toBe(false);
  });
});
