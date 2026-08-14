"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/session";
import { db } from "@/lib/db";
import { serializableTransaction } from "@/lib/transaction";
import { canReviewRequest } from "./approval-policy";
import { calculateRequestedHours, validateLeaveRequest } from "./calculation";
import { leaveDecisionSchema, leaveRequestSchema } from "./validation";
import { canCancelRequest, cancellationOutcome } from "./cancellation-policy";

export type LeaveActionState = { error?: string; preview?: { hours: number; workingDays: number; available: number; after: number } };

const issueMessage = (issue: string, available: number, requested: number) => ({
  NO_WORKING_HOURS: "The selected dates contain no scheduled working hours.",
  OVERLAPPING_REQUEST: "You already have an approved or pending request covering these dates.",
  INSUFFICIENT_ENTITLEMENT: `You have ${available} hours available but this request requires ${requested} hours.`,
  START_AFTER_END: "Start date must be before end date."
}[issue] ?? "The request is invalid.");

export async function submitLeaveRequest(_: LeaveActionState, formData: FormData): Promise<LeaveActionState> {
  const parsed = leaveRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Check the dates and leave type." };
  const user = await getCurrentUser();
  if (!user?.employee) return { error: "Your session has expired. Please sign in again." };

  try {
    const result = await serializableTransaction(db, async transaction => {
      const requestedStart = new Date(parsed.data.startDate);
      const requestedEnd = new Date(parsed.data.endDate);
      if (requestedStart < user.employee!.startDate || (user.employee!.endDate && requestedEnd > user.employee!.endDate)) {
        return { error: "Requested dates must fall within your employment dates." };
      }

      const [leaveType, year, entitlement, approved, pattern, overlaps] = await Promise.all([
        transaction.leaveType.findFirst({ where: { id: parsed.data.leaveTypeId, organisationId: user.employee!.organisationId, active: true } }),
        transaction.leaveYear.findFirst({ where: { organisationId: user.employee!.organisationId, status: "ACTIVE", startDate: { lte: requestedStart }, endDate: { gte: requestedEnd } } }),
        transaction.leaveEntitlement.findFirst({ where: { employeeId: user.employee!.id, leaveYear: { organisationId: user.employee!.organisationId, status: "ACTIVE", startDate: { lte: requestedStart }, endDate: { gte: requestedEnd } } } }),
        transaction.leaveRequest.aggregate({ where: { employeeId: user.employee!.id, status: "APPROVED", leaveType: { deductsFromAnnualEntitlement: true } }, _sum: { requestedHours: true } }),
        transaction.workingPattern.findFirst({ where: { employeeId: user.employee!.id, effectiveFrom: { lte: requestedStart }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: requestedEnd } }] }, orderBy: { effectiveFrom: "desc" } }),
        transaction.leaveRequest.findMany({ where: { employeeId: user.employee!.id, status: { in: ["PENDING", "APPROVED"] }, startDate: { lte: requestedEnd }, endDate: { gte: requestedStart } } })
      ]);
      if (!leaveType) return { error: "The selected leave type is unavailable." };
      if (!pattern || !year || !entitlement) return { error: "Your working pattern, leave year, or entitlement is not configured for these dates. Please contact HR." };

      const holidays = await transaction.bankHoliday.findMany({ where: { organisationId: user.employee!.organisationId, active: true, date: { gte: year.startDate, lte: year.endDate } } });
      const calculation = calculateRequestedHours({
        ...parsed.data,
        pattern: {
          monday: Number(pattern.mondayHours), tuesday: Number(pattern.tuesdayHours), wednesday: Number(pattern.wednesdayHours),
          thursday: Number(pattern.thursdayHours), friday: Number(pattern.fridayHours), saturday: Number(pattern.saturdayHours), sunday: Number(pattern.sundayHours)
        },
        excludeBankHolidays: true,
        bankHolidays: new Set(holidays.map(holiday => holiday.date.toISOString().slice(0, 10)))
      });
      const total = Number(entitlement.entitlementHours) + Number(entitlement.carriedForwardHours) + Number(entitlement.manualAdjustmentHours);
      const available = total - Number(approved._sum.requestedHours ?? 0);
      const issues = validateLeaveRequest({
        requestedHours: calculation.hours,
        availableHours: leaveType.deductsFromAnnualEntitlement ? available : Number.POSITIVE_INFINITY,
        range: parsed.data,
        existing: overlaps.map(request => ({ startDate: request.startDate.toISOString().slice(0, 10), endDate: request.endDate.toISOString().slice(0, 10) }))
      });
      if (issues.length) return { error: issues.map(issue => issueMessage(issue, available, calculation.hours)).join(" ") };

      const approver = user.employee!.managerId
        ? await transaction.user.findUnique({ where: { employeeId: user.employee!.managerId } })
        : await transaction.user.findFirst({ where: { status: "ACTIVE", roles: { some: { role: { name: "HR_ADMIN" } } }, employee: { organisationId: user.employee!.organisationId } } });
      if (!approver) return { error: "This request cannot currently be routed for approval. Please contact HR." };

      const request = await transaction.leaveRequest.create({ data: {
        employeeId: user.employee!.id, leaveTypeId: leaveType.id, startDate: requestedStart, endDate: requestedEnd,
        requestedHours: calculation.hours, employeeNote: parsed.data.employeeNote, status: "PENDING", submittedAt: new Date()
      } });
      await transaction.notification.createMany({ data: [
        { userId: user.id, type: "LEAVE_SUBMITTED", title: "Holiday Request Submitted", message: `${parsed.data.startDate} to ${parsed.data.endDate} · ${calculation.hours} hours · Pending` },
        { userId: approver.id, type: "APPROVAL_REQUIRED", title: "New Request Awaiting Approval", message: `${user.employee!.firstName} ${user.employee!.lastName} requested ${calculation.hours} hours.` }
      ] });
      await transaction.auditLog.create({ data: { organisationId: user.employee!.organisationId, actorUserId: user.id, action: "LEAVE_SUBMITTED", entityType: "LeaveRequest", entityId: request.id, newValue: { status: "PENDING", requestedHours: calculation.hours } } });
      return {};
    });
    if (result.error) return result;
  } catch { return { error: "The request could not be submitted because the leave data changed. Please try again." }; }
  revalidatePath("/leave");
  redirect("/leave");
}

export async function reviewLeaveRequest(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.employee) throw new Error("Unauthorised");
  const parsed = leaveDecisionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid decision");
  const { id, decision, comment } = parsed.data;

  await serializableTransaction(db, async transaction => {
    const request = await transaction.leaveRequest.findUnique({ where: { id }, include: { employee: { include: { user: true } }, leaveType: true } });
    if (!request || request.status !== "PENDING") throw new Error("Request unavailable");
    const permitted = canReviewRequest({ actorUserId: user.id, actorRoles: user.roles, actorEmployeeId: user.employee!.id, requestEmployeeId: request.employeeId, requestManagerId: request.employee.managerId, sameOrganisation: user.employee!.organisationId === request.employee.organisationId });
    if (!permitted) throw new Error("Unauthorised");

    if (decision === "APPROVED" && request.leaveType.deductsFromAnnualEntitlement) {
      const [entitlement, approved, overlap] = await Promise.all([
        transaction.leaveEntitlement.findFirst({ where: { employeeId: request.employeeId, leaveYear: { organisationId: request.employee.organisationId, status: "ACTIVE", startDate: { lte: request.startDate }, endDate: { gte: request.endDate } } } }),
        transaction.leaveRequest.aggregate({ where: { employeeId: request.employeeId, status: "APPROVED", leaveType: { deductsFromAnnualEntitlement: true } }, _sum: { requestedHours: true } }),
        transaction.leaveRequest.count({ where: { id: { not: id }, employeeId: request.employeeId, status: "APPROVED", startDate: { lte: request.endDate }, endDate: { gte: request.startDate } } })
      ]);
      if (!entitlement) throw new Error("Entitlement unavailable");
      const available = Number(entitlement.entitlementHours) + Number(entitlement.carriedForwardHours) + Number(entitlement.manualAdjustmentHours) - Number(approved._sum.requestedHours ?? 0);
      if (Number(request.requestedHours) > available || overlap > 0) throw new Error("Request conflicts with current leave data");
    }

    const updated = await transaction.leaveRequest.updateMany({ where: { id, status: "PENDING" }, data: { status: decision, reviewedBy: user.id, reviewedAt: new Date(), managerComment: comment || null } });
    if (updated.count !== 1) throw new Error("Request unavailable");
    if (request.employee.user) await transaction.notification.create({ data: { userId: request.employee.user.id, type: `LEAVE_${decision}`, title: decision === "APPROVED" ? "Leave Approved" : "Leave Rejected", message: `${request.startDate.toISOString().slice(0, 10)} to ${request.endDate.toISOString().slice(0, 10)} · ${Number(request.requestedHours)} hours${comment ? ` · ${comment}` : ""}` } });
    await transaction.auditLog.create({ data: { organisationId: request.employee.organisationId, actorUserId: user.id, action: decision === "APPROVED" ? "LEAVE_APPROVED" : "LEAVE_REJECTED", entityType: "LeaveRequest", entityId: id, previousValue: { status: "PENDING" }, newValue: { status: decision, comment } } });
  });
  revalidatePath("/manager"); revalidatePath(`/manager/requests/${id}`); redirect("/manager");
}

export async function cancelLeaveRequest(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.employee) throw new Error("Unauthorised");
  const id = String(formData.get("id"));
  await serializableTransaction(db, async transaction => {
    const request = await transaction.leaveRequest.findUnique({ where: { id } });
    if (!request || !canCancelRequest({ actorEmployeeId: user.employee!.id, requestEmployeeId: request.employeeId, status: request.status, startDate: request.startDate })) throw new Error("Request cannot be cancelled");
    if (cancellationOutcome(request.status as "PENDING" | "APPROVED") === "REQUEST_REVIEW") {
      await transaction.leaveRequest.update({ where: { id }, data: { cancellationRequestedAt: new Date() } });
      return;
    }
    await transaction.leaveRequest.update({ where: { id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
    await transaction.auditLog.create({ data: { organisationId: user.employee!.organisationId, actorUserId: user.id, action: "LEAVE_CANCELLED", entityType: "LeaveRequest", entityId: id, previousValue: { status: request.status }, newValue: { status: "CANCELLED" } } });
  });
  revalidatePath("/leave");
}
