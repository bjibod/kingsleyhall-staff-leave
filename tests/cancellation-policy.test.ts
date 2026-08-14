import { describe, expect, it } from "vitest";
import { cancellationOutcome, canCancelRequest } from "@/features/leave/cancellation-policy";

const future = new Date("2026-10-01T00:00:00Z");
const now = new Date("2026-08-14T00:00:00Z");
describe("leave cancellation policy", () => {
  it("allows an employee to cancel their future pending request", () => expect(canCancelRequest({ actorEmployeeId: "e1", requestEmployeeId: "e1", status: "PENDING", startDate: future, now })).toBe(true));
  it("requires review when approved leave is cancelled", () => expect(cancellationOutcome("APPROVED")).toBe("REQUEST_REVIEW"));
  it("cancels pending leave immediately", () => expect(cancellationOutcome("PENDING")).toBe("CANCEL_IMMEDIATELY"));
  it("denies another employee", () => expect(canCancelRequest({ actorEmployeeId: "e2", requestEmployeeId: "e1", status: "PENDING", startDate: future, now })).toBe(false));
  it("denies past and finalised requests", () => {
    expect(canCancelRequest({ actorEmployeeId: "e1", requestEmployeeId: "e1", status: "PENDING", startDate: new Date("2026-01-01"), now })).toBe(false);
    expect(canCancelRequest({ actorEmployeeId: "e1", requestEmployeeId: "e1", status: "REJECTED", startDate: future, now })).toBe(false);
  });
});
