import { createHash, randomBytes } from "node:crypto";

export const INVITATION_LIFETIME_MS = 72 * 60 * 60 * 1000;
export function generateInvitationToken() { return randomBytes(32).toString("base64url"); }
export function hashInvitationToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
export function invitationExpiry(now = new Date()) { return new Date(now.getTime() + INVITATION_LIFETIME_MS); }
export function invitationIsValid(invitation: { usedAt: Date | null; expiresAt: Date }, now = new Date()) { return !invitation.usedAt && invitation.expiresAt > now; }
