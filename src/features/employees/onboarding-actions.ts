"use server";

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import * as Sentry from "@sentry/nextjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/features/auth/session";
import { hasPermission } from "@/features/auth/permissions";
import { generateInvitationToken, hashInvitationToken, invitationExpiry } from "@/features/auth/invitation";
import { db } from "@/lib/db";
import { serverConfig } from "@/lib/config";
import { emailProvider } from "@/services/email";
import { serializableTransaction } from "@/lib/transaction";

export type OnboardingState = { error?: string };
const schema = z.object({
  employeeNumber: z.string().trim().min(1).max(30), firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80),
  workEmail: z.string().email(), jobTitle: z.string().trim().min(1).max(120), employmentType: z.enum(["FULL_TIME", "PART_TIME", "TERM_TIME", "FIXED_TERM", "OTHER"]),
  startDate: z.coerce.date(), locationId: z.string().optional(), departmentId: z.string().optional(), managerId: z.string().optional()
});

async function authorisedAdmin() {
  const actor = await getCurrentUser();
  if (!actor?.employee || !hasPermission(actor.roles, "employee:manage")) throw new Error("Not authorised");
  return actor;
}

async function deliverInvitation(userId: string, email: string) {
  const token = generateInvitationToken();
  await db.$transaction([db.accountInvitationToken.deleteMany({ where: { userId, usedAt: null } }), db.accountInvitationToken.create({ data: { userId, tokenHash: hashInvitationToken(token), expiresAt: invitationExpiry() } })]);
  const url = new URL("/activate-account", serverConfig().APP_URL); url.searchParams.set("token", token);
  await emailProvider().send({ to: email, subject: "Activate your Kingsley Hall staff leave account", text: `Welcome to Kingsley Hall Staff Leave. Create your password within 72 hours: ${url.toString()}\n\nIf you were not expecting this invitation, contact your administrator.`, tag: "account-invitation", idempotencyKey: `account-invitation-${hashInvitationToken(token)}` });
}

export async function createEmployee(_: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const actor = await authorisedAdmin();
  const organisationId = actor.employee!.organisationId;
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the employee details." };
  const data = parsed.data;
  const relatedIds = [data.locationId, data.departmentId, data.managerId].filter(Boolean) as string[];
  if (relatedIds.length) {
    const validCount = await db.employee.count({ where: { id: { in: data.managerId ? [data.managerId] : [] }, organisationId } })
      + await db.location.count({ where: { id: { in: data.locationId ? [data.locationId] : [] }, organisationId } })
      + await db.department.count({ where: { id: { in: data.departmentId ? [data.departmentId] : [] }, organisationId } });
    if (validCount !== relatedIds.length) return { error: "A selected organisation value is invalid." };
  }
  try {
    const created = await serializableTransaction(db, async (tx) => {
      const employee = await tx.employee.create({ data: { organisationId, employeeNumber: data.employeeNumber, firstName: data.firstName, lastName: data.lastName, workEmail: data.workEmail.toLowerCase(), jobTitle: data.jobTitle, employmentType: data.employmentType, startDate: data.startDate, locationId: data.locationId || null, departmentId: data.departmentId || null, managerId: data.managerId || null } });
      const passwordHash = await bcrypt.hash(randomBytes(32).toString("base64url"), 12);
      const user = await tx.user.create({ data: { email: data.workEmail.toLowerCase(), passwordHash, status: "INVITED", employeeId: employee.id } });
      const role = await tx.role.findUnique({ where: { name: "EMPLOYEE" } });
      if (!role) throw new Error("EMPLOYEE role is not configured");
      await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
      await tx.auditLog.create({ data: { organisationId, actorUserId: actor.id, action: "EMPLOYEE_CREATED", entityType: "Employee", entityId: employee.id, newValue: { employeeNumber: employee.employeeNumber, status: "INVITED" } } });
      return { employeeId: employee.id, userId: user.id, email: user.email };
    });
    try { await deliverInvitation(created.userId, created.email); } catch (error) { Sentry.captureException(error, { tags: { operation: "invitation_delivery" } }); console.error(JSON.stringify({ event: "invitation_delivery_failed", error: error instanceof Error ? error.name : "unknown" })); }
    redirect(`/admin/employees/${created.employeeId}`);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return { error: "That employee number or work email is already in use." };
    throw error;
  }
}

export async function resendInvitation(formData: FormData) {
  const actor = await authorisedAdmin();
  const organisationId = actor.employee!.organisationId;
  const employeeId = z.string().cuid().parse(formData.get("employeeId"));
  const employee = await db.employee.findFirst({ where: { id: employeeId, organisationId }, include: { user: true } });
  if (!employee?.user || employee.user.status !== "INVITED") throw new Error("Invitation cannot be resent");
  await deliverInvitation(employee.user.id, employee.user.email);
  redirect(`/admin/employees/${employee.id}?invitation=resent`);
}
