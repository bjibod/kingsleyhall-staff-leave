import { describe, expect, it } from "vitest";
import { recoveryVerificationConfig } from "@/lib/recovery-verification";

const safe: NodeJS.ProcessEnv = { NODE_ENV: "test", DEPLOYMENT_ENV: "recovery-test", RECOVERY_VERIFICATION: "true", RECOVERY_TARGET_CONFIRMED_NON_PRODUCTION: "true", RECOVERY_DATABASE_URL: "postgresql://recovery:secret@restore.example.org:5432/restored" };
describe("recovery verification safety", () => {
  it("accepts an explicitly confirmed isolated PostgreSQL target", () => expect(recoveryVerificationConfig(safe).RECOVERY_DATABASE_URL).toContain("restored"));
  it("refuses the production environment", () => expect(() => recoveryVerificationConfig({ ...safe, DEPLOYMENT_ENV: "production" })).toThrow(/production/));
  it("requires both explicit safety confirmations", () => {
    expect(() => recoveryVerificationConfig({ ...safe, RECOVERY_VERIFICATION: "false" })).toThrow();
    expect(() => recoveryVerificationConfig({ ...safe, RECOVERY_TARGET_CONFIRMED_NON_PRODUCTION: "false" })).toThrow();
  });
  it("refuses non-PostgreSQL recovery targets", () => expect(() => recoveryVerificationConfig({ ...safe, RECOVERY_DATABASE_URL: "https://example.org/database" })).toThrow(/PostgreSQL/));
});
