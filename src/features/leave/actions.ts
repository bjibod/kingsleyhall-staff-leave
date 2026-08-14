"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/features/auth/session";
import { calculateRequestedHours, validateLeaveRequest } from "./calculation";
import { canReviewRequest } from "./approval-policy";

export type LeaveActionState = { error?: string; preview?: { hours: number; workingDays: number; available: number; after: number } };
const requestSchema = z.object({ leaveTypeId: z.string().min(1), startDate: z.string().date(), endDate: z.string().date(), employeeNote: z.string().max(1000).optional() });

async function requestContext() {
  const user = await getCurrentUser(); if (!user?.employee) throw new Error("UNAUTHENTICATED");
  const [pattern, year, entitlement, approved, pending] = await Promise.all([
    db.workingPattern.findFirst({ where: { employeeId: user.employee.id, effectiveFrom: { lte: new Date() }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }] }, orderBy: { effectiveFrom: "desc" } }),
    db.leaveYear.findFirst({ where: { organisationId: user.employee.organisationId, status: "ACTIVE" } }),
    db.leaveEntitlement.findFirst({ where: { employeeId: user.employee.id, leaveYear: { status: "ACTIVE" } } }),
    db.leaveRequest.aggregate({ where: { employeeId: user.employee.id, status: "APPROVED", leaveType: { deductsFromAnnualEntitlement: true } }, _sum: { requestedHours: true } }),
    db.leaveRequest.aggregate({ where: { employeeId: user.employee.id, status: "PENDING", leaveType: { deductsFromAnnualEntitlement: true } }, _sum: { requestedHours: true } })
  ]);
  if (!pattern || !year || !entitlement) throw new Error("LEAVE_CONFIGURATION_MISSING");
  const total = Number(entitlement.entitlementHours) + Number(entitlement.carriedForwardHours) + Number(entitlement.manualAdjustmentHours);
  return { user, pattern, year, available: total - Number(approved._sum.requestedHours ?? 0), pending: Number(pending._sum.requestedHours ?? 0) };
}

export async function submitLeaveRequest(_: LeaveActionState, formData: FormData): Promise<LeaveActionState> {
  const parsed = requestSchema.safeParse(Object.fromEntries(formData)); if (!parsed.success) return { error: "Check the dates and leave type." };
  try {
    const { user, pattern, year, available } = await requestContext();
    const holidays = await db.bankHoliday.findMany({ where: { organisationId: user.employee!.organisationId, active: true, date: { gte: year.startDate, lte: year.endDate } } });
    const calculation = calculateRequestedHours({ ...parsed.data, pattern: { monday: Number(pattern.mondayHours), tuesday: Number(pattern.tuesdayHours), wednesday: Number(pattern.wednesdayHours), thursday: Number(pattern.thursdayHours), friday: Number(pattern.fridayHours), saturday: Number(pattern.saturdayHours), sunday: Number(pattern.sundayHours) }, excludeBankHolidays: true, bankHolidays: new Set(holidays.map(h => h.date.toISOString().slice(0,10))) });
    const overlaps = await db.leaveRequest.findMany({ where: { employeeId: user.employee!.id, status: { in: ["PENDING", "APPROVED"] }, startDate: { lte: new Date(parsed.data.endDate) }, endDate: { gte: new Date(parsed.data.startDate) } } });
    const issues = validateLeaveRequest({ requestedHours: calculation.hours, availableHours: available, range: parsed.data, existing: overlaps.map(r => ({ startDate: r.startDate.toISOString().slice(0,10), endDate: r.endDate.toISOString().slice(0,10) })) });
    if (issues.length) return { error: issues.map(i => ({ NO_WORKING_HOURS: "The selected dates contain no scheduled working hours.", OVERLAPPING_REQUEST: "You already have an approved or pending request covering these dates.", INSUFFICIENT_ENTITLEMENT: `You have ${available} hours available but this request requires ${calculation.hours} hours.`, START_AFTER_END: "Start date must be before end date." }[i])).join(" ") };
    const approver = user.employee!.managerId ? await db.user.findUnique({ where: { employeeId: user.employee!.managerId } }) : await db.user.findFirst({ where: { roles: { some: { role: { name: "HR_ADMIN" } } }, employee: { organisationId: user.employee!.organisationId } } });
    if (!approver) return { error: "This request cannot currently be routed for approval. Please contact HR." };
    await db.$transaction(async tx => {
      const request = await tx.leaveRequest.create({ data: { employeeId: user.employee!.id, leaveTypeId: parsed.data.leaveTypeId, startDate: new Date(parsed.data.startDate), endDate: new Date(parsed.data.endDate), requestedHours: calculation.hours, employeeNote: parsed.data.employeeNote, status: "PENDING", submittedAt: new Date() } });
      await tx.notification.createMany({ data: [{ userId: user.id, type: "LEAVE_SUBMITTED", title: "Holiday Request Submitted", message: `${parsed.data.startDate} to ${parsed.data.endDate} · ${calculation.hours} hours · Pending` }, { userId: approver.id, type: "APPROVAL_REQUIRED", title: "New Request Awaiting Approval", message: `${user.employee!.firstName} ${user.employee!.lastName} requested ${calculation.hours} hours.` }] });
      await tx.auditLog.create({ data: { organisationId: user.employee!.organisationId, actorUserId: user.id, action: "LEAVE_SUBMITTED", entityType: "LeaveRequest", entityId: request.id, newValue: { status: "PENDING", requestedHours: calculation.hours } } });
    });
  } catch (error) { return { error: error instanceof Error && error.message === "LEAVE_CONFIGURATION_MISSING" ? "Your working pattern or entitlement is not configured. Please contact HR." : "The request could not be submitted." }; }
  revalidatePath("/leave"); redirect("/leave");
}

export async function reviewLeaveRequest(formData: FormData) {
  const user = await getCurrentUser(); if (!user?.employee) throw new Error("Unauthorised");
  const id = String(formData.get("id")); const decision = String(formData.get("decision")); const comment = String(formData.get("comment") ?? "").trim();
  if (!['APPROVED','REJECTED'].includes(decision) || (decision === "REJECTED" && !comment)) throw new Error("Invalid decision");
  const request = await db.leaveRequest.findUnique({ where: { id }, include: { employee: { include: { user: true } } } }); if (!request || request.status !== "PENDING") throw new Error("Request unavailable");
  const permitted = canReviewRequest({ actorUserId: user.id, actorRoles: user.roles, actorEmployeeId: user.employee.id, requestEmployeeId: request.employeeId, requestManagerId: request.employee.managerId, sameOrganisation: user.employee.organisationId === request.employee.organisationId });
  if (!permitted) throw new Error("Unauthorised");
  await db.$transaction(async tx => {
    await tx.leaveRequest.update({ where: { id }, data: { status: decision as "APPROVED"|"REJECTED", reviewedBy: user.id, reviewedAt: new Date(), managerComment: comment || null } });
    if (request.employee.user) await tx.notification.create({ data: { userId: request.employee.user.id, type: `LEAVE_${decision}`, title: decision === "APPROVED" ? "Leave Approved" : "Leave Rejected", message: `${request.startDate.toISOString().slice(0,10)} to ${request.endDate.toISOString().slice(0,10)} · ${Number(request.requestedHours)} hours${comment ? ` · ${comment}` : ""}` } });
    await tx.auditLog.create({ data: { organisationId: request.employee.organisationId, actorUserId: user.id, action: decision === "APPROVED" ? "LEAVE_APPROVED" : "LEAVE_REJECTED", entityType: "LeaveRequest", entityId: id, previousValue: { status: "PENDING" }, newValue: { status: decision, comment } } });
  });
  revalidatePath("/manager"); revalidatePath(`/manager/requests/${id}`); redirect("/manager");
}

export async function cancelLeaveRequest(formData: FormData) {
  const user = await getCurrentUser(); if (!user?.employee) throw new Error("Unauthorised"); const id=String(formData.get("id"));
  const request=await db.leaveRequest.findUnique({where:{id}}); if(!request||request.employeeId!==user.employee.id||!(["PENDING","APPROVED"] as string[]).includes(request.status)||request.startDate<=new Date())throw new Error("Request cannot be cancelled");
  if(request.status==="APPROVED"){await db.leaveRequest.update({where:{id},data:{cancellationRequestedAt:new Date()}});return revalidatePath("/leave");}
  await db.$transaction(async tx=>{await tx.leaveRequest.update({where:{id},data:{status:"CANCELLED",cancelledAt:new Date()}});await tx.auditLog.create({data:{organisationId:user.employee!.organisationId,actorUserId:user.id,action:"LEAVE_CANCELLED",entityType:"LeaveRequest",entityId:id,previousValue:{status:request.status},newValue:{status:"CANCELLED"}}})});revalidatePath("/leave");
}
