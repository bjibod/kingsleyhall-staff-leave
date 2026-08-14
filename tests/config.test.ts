import { describe, expect, it } from "vitest";
import { serverConfig } from "@/lib/config";

const valid: NodeJS.ProcessEnv = { NODE_ENV: "test", APP_URL: "https://leave.example.org", AUTH_SECRET: "a-secure-secret-with-at-least-32-characters", DATABASE_URL: "postgresql://db.example.org/leave" };
describe("server configuration", () => {
  it("applies safe display defaults", () => expect(serverConfig(valid).APP_TIMEZONE).toBe("Europe/London"));
  it("requires a strong secret", () => expect(() => serverConfig({ ...valid, AUTH_SECRET: "short" })).toThrow());
  it("requires an absolute URL", () => expect(() => serverConfig({ ...valid, APP_URL: "localhost" })).toThrow());
});
