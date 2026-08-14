import bcrypt from "bcryptjs";
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { hashSessionToken } from "@/features/auth/session";

const enabled = process.env.RUN_DATABASE_TESTS === "true";
const suite = enabled ? describe : describe.skip;
const prisma = enabled ? new PrismaClient() : null;
afterAll(async () => { await prisma?.$disconnect(); });

suite("production database lifecycle", () => {
  it("persists authentication and the leave decision lifecycle transactionally", async () => {
    const db = prisma!;
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const result = await db.$transaction(async tx => {
      const organisation = await tx.organisation.create({ data: { name: `Test ${suffix}` } });
      const managerEmployee = await tx.employee.create({ data: { organisationId: organisation.id, employeeNumber: `M-${suffix}`, firstName: "Test", lastName: "Manager", workEmail: `manager-${suffix}@example.test`, jobTitle: "Manager", employmentType: "FULL_TIME", startDate: new Date("2025-01-01") } });
      const employee = await tx.employee.create({ data: { organisationId: organisation.id, employeeNumber: `E-${suffix}`, firstName: "Test", lastName: "Employee", workEmail: `employee-${suffix}@example.test`, jobTitle: "Worker", employmentType: "FULL_TIME", startDate: new Date("2025-01-01"), managerId: managerEmployee.id } });
      const passwordHash = await bcrypt.hash("integration password", 4);
      const manager = await tx.user.create({ data: { email: managerEmployee.workEmail, passwordHash, status: "ACTIVE", employeeId: managerEmployee.id } });
      const user = await tx.user.create({ data: { email: employee.workEmail, passwordHash, status: "ACTIVE", employeeId: employee.id } });
      await tx.session.create({ data: { userId: user.id, tokenHash: hashSessionToken(`session-${suffix}`), expiresAt: new Date("2030-01-01") } });
      const year = await tx.leaveYear.create({ data: { organisationId: organisation.id, name: `2026-${suffix}`, startDate: new Date("2026-04-01"), endDate: new Date("2027-03-31"), status: "ACTIVE" } });
      const type = await tx.leaveType.create({ data: { organisationId: organisation.id, name: "Annual leave", code: `ANNUAL-${suffix}` } });
      const entitlement = await tx.leaveEntitlement.create({ data: { employeeId: employee.id, leaveYearId: year.id, entitlementHours: 160 } });
      const approved = await tx.leaveRequest.create({ data: { employeeId: employee.id, leaveTypeId: type.id, startDate: new Date("2026-10-01"), endDate: new Date("2026-10-02"), requestedHours: 16, status: "PENDING", submittedAt: new Date() } });
      await tx.leaveRequest.update({ where: { id: approved.id }, data: { status: "APPROVED", reviewedBy: manager.id, reviewedAt: new Date() } });
      const rejected = await tx.leaveRequest.create({ data: { employeeId: employee.id, leaveTypeId: type.id, startDate: new Date("2026-11-01"), endDate: new Date("2026-11-01"), requestedHours: 8, status: "PENDING", submittedAt: new Date() } });
      await tx.leaveRequest.update({ where: { id: rejected.id }, data: { status: "REJECTED", reviewedBy: manager.id, reviewedAt: new Date(), managerComment: "Coverage unavailable" } });
      const cancelled = await tx.leaveRequest.create({ data: { employeeId: employee.id, leaveTypeId: type.id, startDate: new Date("2026-12-01"), endDate: new Date("2026-12-01"), requestedHours: 8, status: "CANCELLED", submittedAt: new Date(), cancelledAt: new Date() } });
      await tx.leaveEntitlement.update({ where: { id: entitlement.id }, data: { manualAdjustmentHours: 8, adjustmentReason: "Integration test" } });
      await tx.auditLog.create({ data: { organisationId: organisation.id, actorUserId: manager.id, action: "LEAVE_APPROVED", entityType: "LeaveRequest", entityId: approved.id, previousValue: { status: "PENDING" }, newValue: { status: "APPROVED" } } });
      return { userId: user.id, approvedId: approved.id, rejectedId: rejected.id, cancelledId: cancelled.id, entitlementId: entitlement.id };
    });
    expect(await bcrypt.compare("integration password", (await db.user.findUniqueOrThrow({ where: { id: result.userId } })).passwordHash)).toBe(true);
    expect((await db.session.count({ where: { userId: result.userId, expiresAt: { gt: new Date() } } }))).toBe(1);
    expect((await db.leaveRequest.findUniqueOrThrow({ where: { id: result.approvedId } })).status).toBe("APPROVED");
    expect((await db.leaveRequest.findUniqueOrThrow({ where: { id: result.rejectedId } })).status).toBe("REJECTED");
    expect((await db.leaveRequest.findUniqueOrThrow({ where: { id: result.cancelledId } })).status).toBe("CANCELLED");
    expect(Number((await db.leaveEntitlement.findUniqueOrThrow({ where: { id: result.entitlementId } })).manualAdjustmentHours)).toBe(8);
    expect(await db.auditLog.count({ where: { entityId: result.approvedId, action: "LEAVE_APPROVED" } })).toBe(1);
  }, 30_000);
});
