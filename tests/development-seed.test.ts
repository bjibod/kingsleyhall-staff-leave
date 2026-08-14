import { describe, expect, it } from "vitest";
import { developmentSeedConfig } from "@/lib/development-seed";

const valid: NodeJS.ProcessEnv = {
  NODE_ENV: "development",
  ALLOW_DEMO_SEED: "true",
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/kingsley_leave",
  DEMO_SEED_PASSWORD: "local-only-password"
};

describe("development fixture safeguards", () => {
  it("refuses production", () => expect(() => developmentSeedConfig({ ...valid, NODE_ENV: "production" })).toThrow(/disabled in production/));
  it("requires explicit opt-in", () => expect(() => developmentSeedConfig({ ...valid, ALLOW_DEMO_SEED: "false" })).toThrow(/ALLOW_DEMO_SEED/));
  it("refuses a remote database", () => expect(() => developmentSeedConfig({ ...valid, DATABASE_URL: "postgresql://db.example.org/leave" })).toThrow(/local database/));
  it("requires a non-trivial local password", () => expect(() => developmentSeedConfig({ ...valid, DEMO_SEED_PASSWORD: "short" })).toThrow(/14 characters/));
  it("allows an explicitly confirmed local development database", () => expect(developmentSeedConfig(valid).password).toBe(valid.DEMO_SEED_PASSWORD));
});
