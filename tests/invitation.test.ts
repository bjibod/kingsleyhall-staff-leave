import { describe, expect, it } from "vitest";
import { generateInvitationToken, hashInvitationToken, invitationExpiry, invitationIsValid, INVITATION_LIFETIME_MS } from "@/features/auth/invitation";

describe("staff invitations", () => {
  it("creates opaque one-way token hashes", () => { const token = generateInvitationToken(); expect(token.length).toBeGreaterThanOrEqual(40); expect(hashInvitationToken(token)).not.toContain(token); });
  it("expires invitations after 72 hours", () => { const now = new Date("2026-08-14T12:00:00Z"); expect(invitationExpiry(now).getTime() - now.getTime()).toBe(INVITATION_LIFETIME_MS); });
  it("accepts only unused, unexpired invitations", () => { const now = new Date("2026-08-14T12:00:00Z"); expect(invitationIsValid({ usedAt: null, expiresAt: new Date("2026-08-14T13:00:00Z") }, now)).toBe(true); expect(invitationIsValid({ usedAt: now, expiresAt: new Date("2026-08-14T13:00:00Z") }, now)).toBe(false); expect(invitationIsValid({ usedAt: null, expiresAt: now }, now)).toBe(false); });
});
