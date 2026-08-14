"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, deleteCurrentSession } from "./session";
import { hashThrottleKey, isLoginBlocked, nextThrottleState } from "./security";
import { serverConfig } from "@/lib/config";

const credentialsSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(128) });
export type LoginState = { error?: string };

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = credentialsSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Enter a valid email address and password." };
  const email = parsed.data.email.toLowerCase();
  const requestHeaders = await headers();
  const address = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || "unknown";
  const keyHash = hashThrottleKey(email, address, serverConfig().AUTH_SECRET);
  const throttle = await db.authThrottle.findUnique({ where: { keyHash } });
  if (isLoginBlocked(throttle)) return { error: "Too many sign-in attempts. Try again later." };
  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.status !== "ACTIVE" || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    const next = nextThrottleState(throttle);
    await db.authThrottle.upsert({ where: { keyHash }, create: { keyHash, ...next }, update: next });
    return { error: "Email or password is incorrect." };
  }
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
    db.authThrottle.deleteMany({ where: { keyHash } }),
    db.session.deleteMany({ where: { userId: user.id, expiresAt: { lte: new Date() } } })
  ]);
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout() { await deleteCurrentSession(); redirect("/login"); }
