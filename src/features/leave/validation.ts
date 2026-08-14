import { z } from "zod";

export const leaveRequestSchema = z.object({
  leaveTypeId: z.string().cuid(), startDate: z.string().date(), endDate: z.string().date(), employeeNote: z.string().trim().max(1000).optional()
});

export const leaveDecisionSchema = z.object({
  id: z.string().cuid(), decision: z.enum(["APPROVED", "REJECTED"]), comment: z.string().trim().max(1000).default("")
}).superRefine((value, context) => {
  if (value.decision === "REJECTED" && !value.comment) context.addIssue({ code: "custom", path: ["comment"], message: "A rejection reason is required" });
});
