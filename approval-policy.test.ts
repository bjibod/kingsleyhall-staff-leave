import { describe, expect, it } from "vitest";
import { canReviewRequest } from "@/features/leave/approval-policy";

describe("approval policy", () => {
  const request = { actorUserId: "u1", requestEmployeeId: "e2", requestManagerId: "e1", sameOrganisation: true };
  it("allows the assigned manager", () => expect(canReviewRequest({ ...request, actorRoles: ["MANAGER"], actorEmployeeId: "e1" })).toBe(true));
  it("denies unrelated managers", () => expect(canReviewRequest({ ...request, actorRoles: ["MANAGER"], actorEmployeeId: "e9" })).toBe(false));
  it("denies self approval", () => expect(canReviewRequest({ ...request, actorRoles: ["HR_ADMIN"], actorEmployeeId: "e2" })).toBe(false));
  it("denies cross-organisation access", () => expect(canReviewRequest({ ...request, actorRoles: ["SUPER_ADMIN"], actorEmployeeId: "e9", sameOrganisation: false })).toBe(false));
});
