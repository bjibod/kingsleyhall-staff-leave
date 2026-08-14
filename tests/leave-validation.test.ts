import { describe, expect, it } from "vitest";
import { leaveDecisionSchema, leaveRequestSchema } from "@/features/leave/validation";

describe("leave boundary validation", () => {
  it("rejects malformed leave identifiers", () => expect(leaveRequestSchema.safeParse({ leaveTypeId: "other-tenant", startDate: "2026-09-01", endDate: "2026-09-02" }).success).toBe(false));
  it("limits employee notes", () => expect(leaveRequestSchema.safeParse({ leaveTypeId: "cm12345678901234567890123", startDate: "2026-09-01", endDate: "2026-09-02", employeeNote: "x".repeat(1001) }).success).toBe(false));
  it("requires a rejection reason", () => expect(leaveDecisionSchema.safeParse({ id: "cm12345678901234567890123", decision: "REJECTED", comment: "" }).success).toBe(false));
});
