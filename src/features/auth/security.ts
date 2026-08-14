import { createHash, createHmac, randomBytes } from "node:crypto";
import { z } from "zod";

export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_BLOCK_MS = 15 * 60 * 1000;
export const MAX_LOGIN_FAILURES = 5;

export const passwordSchema = z.string().min(12, "Use at least 12 characters.").max(128, "Password is too long.");

export type ThrottleState = { failures: number; windowStartedAt: Date; blockedUntil: Date | null };

export function hashThrottleKey(email: string, address: string, secret: string) {
  return createHmac("sha256", secret).update(`${email.trim().toLowerCase()}\0${address}`).digest("hex");
}

export function isLoginBlocked(state: ThrottleState | null, now = new Date()) {
  return Boolean(state?.blockedUntil && state.blockedUntil > now);
}

export function nextThrottleState(state: ThrottleState | null, now = new Date()): ThrottleState {
  const outsideWindow = !state || now.getTime() - state.windowStartedAt.getTime() >= LOGIN_WINDOW_MS;
  const failures = outsideWindow ? 1 : state.failures + 1;
  return {
    failures,
    windowStartedAt: outsideWindow ? now : state.windowStartedAt,
    blockedUntil: failures >= MAX_LOGIN_FAILURES ? new Date(now.getTime() + LOGIN_BLOCK_MS) : null
  };
}

export function generateResetToken() { return randomBytes(32).toString("base64url"); }
export function hashResetToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
