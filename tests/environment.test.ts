import { describe, expect, it } from "vitest";
import { serverConfig } from "@/lib/config";

const base: NodeJS.ProcessEnv = { NODE_ENV: "test", APP_URL: "https://leave-staging.example.org", AUTH_SECRET: "x".repeat(32), DATABASE_URL: "postgresql://user:pass@db.example.org:5432/leave" };
describe("deployment environment separation", () => {
  it("accepts the explicit staging environment", () => expect(serverConfig({ ...base, DEPLOYMENT_ENV: "staging", RELEASE_SHA: "abc123" })).toMatchObject({ DEPLOYMENT_ENV: "staging", RELEASE_SHA: "abc123" }));
  it("rejects an unknown environment label", () => expect(() => serverConfig({ ...base, DEPLOYMENT_ENV: "live-ish" })).toThrow());
  it("does not default an unspecified deployment to production", () => expect(serverConfig(base).DEPLOYMENT_ENV).toBe("development"));
});
