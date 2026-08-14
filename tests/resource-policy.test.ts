import { describe, expect, it } from "vitest";
import { canManageEmployee, canViewEmployee } from "@/features/auth/resource-policy";

const actor = { actorEmployeeId: "employee-1", actorOrganisationId: "org-1", actorRoles: ["EMPLOYEE"] };
describe("employee resource policy", () => {
  it("allows self", () => expect(canViewEmployee(actor, { id: "employee-1", organisationId: "org-1" })).toBe(true));
  it("denies another employee", () => expect(canViewEmployee(actor, { id: "employee-2", organisationId: "org-1" })).toBe(false));
  it("allows a direct-report manager", () => expect(canViewEmployee({ ...actor, actorRoles: ["MANAGER"] }, { id: "employee-2", organisationId: "org-1", managerId: "employee-1" })).toBe(true));
  it("denies an unrelated manager", () => expect(canViewEmployee({ ...actor, actorRoles: ["MANAGER"] }, { id: "employee-2", organisationId: "org-1", managerId: "employee-9" })).toBe(false));
  it("denies cross-organisation admin access", () => expect(canViewEmployee({ ...actor, actorRoles: ["SUPER_ADMIN"] }, { id: "employee-2", organisationId: "org-2" })).toBe(false));
  it("allows same-organisation HR management", () => expect(canManageEmployee({ ...actor, actorRoles: ["HR_ADMIN"] }, { id: "employee-2", organisationId: "org-1" })).toBe(true));
});
