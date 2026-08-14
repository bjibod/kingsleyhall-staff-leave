"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashInvitationToken, invitationIsValid } from "./invitation";
import { passwordSchema } from "./security";

export type ActivationState = { error?: string; success?: string };
const schema = z.object({ token: z.string().min(32).max(256), password: passwordSchema, confirmPassword: z.string() }).refine(value => value.password === value.confirmPassword, { message: "Passwords do not match.", path: ["confirmPassword"] });

export async function activateAccount(_: ActivationState, formData: FormData): Promise<ActivationState> {
  const parsed = schema.safeParse({ token: formData.get("token"), password: formData.get("password"), confirmPassword: formData.get("confirmPassword") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the password details." };
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const activated = await db.$transaction(async tx => {
    const invitation = await tx.accountInvitationToken.findUnique({ where: { tokenHash: hashInvitationToken(parsed.data.token) }, include: { user: { select: { status: true } } } });
    if (!invitation || invitation.user.status !== "INVITED" || !invitationIsValid(invitation)) return false;
    const claimed = await tx.accountInvitationToken.updateMany({ where: { id: invitation.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
    if (claimed.count !== 1) return false;
    await tx.user.update({ where: { id: invitation.userId }, data: { passwordHash, status: "ACTIVE" } });
    await tx.accountInvitationToken.deleteMany({ where: { userId: invitation.userId, id: { not: invitation.id }, usedAt: null } });
    return true;
  });
  return activated ? { success: "Your account is active. You can now sign in." } : { error: "This invitation is invalid or has expired. Ask an administrator to resend it." };
}
