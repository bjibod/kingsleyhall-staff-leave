import { describe, expect, it } from "vitest";
import { hashSessionToken } from "@/features/auth/session";

describe("session tokens", () => {
  it("hashes tokens deterministically without storing the source token", () => {
    const hash = hashSessionToken("secret-session-token");
    expect(hash).toHaveLength(64);
    expect(hash).toBe(hashSessionToken("secret-session-token"));
    expect(hash).not.toContain("secret-session-token");
  });
});
