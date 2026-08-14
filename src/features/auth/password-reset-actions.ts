"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { serverConfig } from "@/lib/config";
import { emailProvider } from "@/services/email";
import { generateResetToken, hashResetToken, passwordSchema } from "./security";

export type PasswordResetState = { error?: string; success?: string };
const requestSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({ token: z.string().min(32).max(256), password: passwordSchema, confirmPassword: z.string() }).refine((value) => value.password === value.confirmPassword, { message: "Passwords do not match.", path: ["confirmPassword"] });
const genericRequestMessage = "If an active account matches that address, a reset link has been sent.";

export async function requestPasswordReset(_: PasswordResetState, formData: FormData): Promise<PasswordResetState> {
  const parsed = requestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: "Enter a valid work email address." };
  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() }, select: { id: true, email: true, status: true } });
  if (!user || user.status !== "ACTIVE") return { success: genericRequestMessage };

  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await db.$transaction([
    db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
    db.passwordResetToken.create({ data: { tokenHash: hashResetToken(token), userId: user.id, expiresAt } })
  ]);
  try {
    const config = serverConfig();
    const url = new URL("/reset-password", config.APP_URL);
    url.searchParams.set("token", token);
    await emailProvider().send({ to: user.email, subject: "Reset your Kingsley Hall leave password", text: `Use this one-time link within 30 minutes: ${url.toString()}\n\nIf you did not request this, ignore this email.` });
  } catch (error) {
    console.error(JSON.stringify({ event: "password_reset_delivery_failed", error: error instanceof Error ? error.name : "unknown" }));
  }
  return { success: genericRequestMessage };
}

export async function resetPassword(_: PasswordResetState, formData: FormData): Promise<PasswordResetState> {
  const parsed = resetSchema.safeParse({ token: formData.get("token"), password: formData.get("password"), confirmPassword: formData.get("confirmPassword") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the password details." };
  const tokenHash = hashResetToken(parsed.data.token);
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const changed = await db.$transaction(async (tx) => {
    const reset = await tx.passwordResetToken.findUnique({ where: { tokenHash }, include: { user: { select: { status: true } } } });
    if (!reset || reset.usedAt || reset.expiresAt <= new Date() || reset.user.status !== "ACTIVE") return false;
    const claimed = await tx.passwordResetToken.updateMany({ where: { id: reset.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
    if (claimed.count !== 1) return false;
    await tx.user.update({ where: { id: reset.userId }, data: { passwordHash } });
    await tx.session.deleteMany({ where: { userId: reset.userId } });
    await tx.passwordResetToken.deleteMany({ where: { userId: reset.userId, id: { not: reset.id }, usedAt: null } });
    return true;
  });
  return changed ? { success: "Password changed. You can now sign in." } : { error: "This reset link is invalid or has expired. Request a new one." };
}
