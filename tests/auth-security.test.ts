import { describe, expect, it } from "vitest";
import { generateResetToken, hashResetToken, hashThrottleKey, isLoginBlocked, MAX_LOGIN_FAILURES, nextThrottleState, passwordSchema } from "../src/features/auth/security";

describe("authentication security", () => {
  it("creates deterministic opaque throttle keys", () => {
    const first = hashThrottleKey("Person@Example.org", "192.0.2.1", "a".repeat(32));
    expect(first).toBe(hashThrottleKey("person@example.org", "192.0.2.1", "a".repeat(32)));
    expect(first).not.toContain("person@example.org");
    expect(first).not.toContain("192.0.2.1");
  });
  it("blocks at the configured failure threshold", () => {
    const now = new Date("2026-08-14T12:00:00Z");
    let state = null;
    for (let attempt = 0; attempt < MAX_LOGIN_FAILURES; attempt += 1) state = nextThrottleState(state, now);
    expect(isLoginBlocked(state, now)).toBe(true);
    expect(isLoginBlocked(state, new Date("2026-08-14T12:16:00Z"))).toBe(false);
  });
  it("resets the failure window after fifteen minutes", () => {
    const old = { failures: 4, windowStartedAt: new Date("2026-08-14T11:00:00Z"), blockedUntil: null };
    expect(nextThrottleState(old, new Date("2026-08-14T12:00:00Z")).failures).toBe(1);
  });
  it("generates one-way reset token storage values", () => {
    const token = generateResetToken();
    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(hashResetToken(token)).not.toContain(token);
  });
  it("requires passwords of at least twelve characters", () => {
    expect(passwordSchema.safeParse("short").success).toBe(false);
    expect(passwordSchema.safeParse("a secure passphrase").success).toBe(true);
  });
});
