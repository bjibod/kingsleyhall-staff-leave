import { describe, expect, it } from "vitest";
import { calculateBalance, calculateEntitlement, calculateRequestedHours, rangesOverlap, validateLeaveRequest } from "@/features/leave/calculation";

const fullTime = { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0 };
const variable = { monday: 8, tuesday: 6, wednesday: 0, thursday: 8, friday: 6, saturday: 0, sunday: 0 };

describe("leave calculation", () => {
  it("calculates one full-time day", () => expect(calculateRequestedHours({ startDate: "2026-08-10", endDate: "2026-08-10", pattern: fullTime }).hours).toBe(8));
  it("calculates multiple weekdays and excludes weekends", () => expect(calculateRequestedHours({ startDate: "2026-08-07", endDate: "2026-08-11", pattern: fullTime })).toMatchObject({ hours: 24, workingDays: 3 }));
  it("does not deduct non-working days", () => expect(calculateRequestedHours({ startDate: "2026-08-12", endDate: "2026-08-12", pattern: variable }).hours).toBe(0));
  it("uses variable scheduled hours", () => expect(calculateRequestedHours({ startDate: "2026-08-11", endDate: "2026-08-11", pattern: variable }).hours).toBe(6));
  it("supports half days without assuming four hours", () => expect(calculateRequestedHours({ startDate: "2026-08-11", endDate: "2026-08-11", pattern: variable, startPeriod: "AM" }).hours).toBe(3));
  it("applies configured bank-holiday exclusion", () => expect(calculateRequestedHours({ startDate: "2026-08-10", endDate: "2026-08-11", pattern: fullTime, bankHolidays: new Set(["2026-08-10"]), excludeBankHolidays: true })).toEqual({ hours: 8, workingDays: 1, excludedBankHolidays: ["2026-08-10"] }));
  it("includes carried forward and manual adjustments", () => expect(calculateEntitlement({ base: 160, carriedForward: 8, adjustment: -4 })).toBe(164));
  it("reports approved and potential balances separately", () => expect(calculateBalance({ base: 160, carriedForward: 8, adjustment: -4, approved: 40, pending: 24 })).toEqual({ entitlement: 164, approved: 40, pending: 24, remaining: 124, potentialRemaining: 100 }));
  it("detects inclusive overlaps", () => expect(rangesOverlap({ startDate: "2026-08-10", endDate: "2026-08-12" }, { startDate: "2026-08-12", endDate: "2026-08-13" })).toBe(true));
  it("detects overlap and insufficient entitlement", () => expect(validateLeaveRequest({ requestedHours: 24, availableHours: 16, range: { startDate: "2026-08-10", endDate: "2026-08-12" }, existing: [{ startDate: "2026-08-11", endDate: "2026-08-11" }] })).toEqual(["OVERLAPPING_REQUEST", "INSUFFICIENT_ENTITLEMENT"]));
  it("rejects reversed ranges", () => expect(() => calculateRequestedHours({ startDate: "2026-08-12", endDate: "2026-08-10", pattern: fullTime })).toThrow("START_AFTER_END"));
});
