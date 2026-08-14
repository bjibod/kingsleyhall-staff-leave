import { describe, expect, it } from "vitest";
import { leaveCancelledEmail, leaveDecisionEmail, leaveSubmittedEmail, managerApprovalEmail, managerCancellationEmail } from "@/services/email-templates";

const details = { id: "request-1", startDate: "2026-09-01", endDate: "2026-09-02", hours: 16, appUrl: "https://leave.example.org" };
describe("transactional leave email templates", () => {
  it("covers submission and manager approval journeys", () => {
    expect(leaveSubmittedEmail("employee@example.org", details)).toMatchObject({ tag: "leave-submitted", idempotencyKey: "leave-submitted-request-1" });
    expect(managerApprovalEmail("manager@example.org", "Test Employee", details).text).toContain("/manager/requests/request-1");
  });
  it.each(["APPROVED", "REJECTED"] as const)("creates a %s decision without a manager comment", decision => {
    const message = leaveDecisionEmail("employee@example.org", decision, details);
    expect(message.subject.toLowerCase()).toContain(decision.toLowerCase()); expect(message.text).not.toContain("Coverage");
  });
  it("distinguishes immediate cancellation from review", () => {
    expect(leaveCancelledEmail("employee@example.org", details, false).tag).toBe("leave-cancelled");
    expect(leaveCancelledEmail("employee@example.org", details, true).subject).toContain("requested");
    expect(managerCancellationEmail("manager@example.org", "Test Employee", details).tag).toBe("cancellation-review");
  });
  it("does not include notes, passwords, cookies or tokens", () => {
    const serialized = JSON.stringify([leaveSubmittedEmail("employee@example.org", details), managerApprovalEmail("manager@example.org", "Test Employee", details)]);
    expect(serialized).not.toMatch(/password|cookie|session|employeeNote|managerComment/i);
  });
});
