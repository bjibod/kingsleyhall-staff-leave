import { describe, expect, it } from "vitest";
import { hasPermission } from "@/features/auth/permissions";

describe("role permissions", () => {
  it("allows employees to request their own leave but not manage staff", () => {
    expect(hasPermission(["EMPLOYEE"], "leave:request:self")).toBe(true);
    expect(hasPermission(["EMPLOYEE"], "employee:manage")).toBe(false);
  });
  it("allows managers to review reports but not alter entitlement", () => {
    expect(hasPermission(["MANAGER"], "leave:review:reports")).toBe(true);
    expect(hasPermission(["MANAGER"], "entitlement:manage")).toBe(false);
  });
  it("allows HR to manage entitlement but not system roles", () => {
    expect(hasPermission(["HR_ADMIN"], "entitlement:manage")).toBe(true);
    expect(hasPermission(["HR_ADMIN"], "role:manage")).toBe(false);
  });
  it("allows super administrators to manage configuration", () => {
    expect(hasPermission(["SUPER_ADMIN"], "configuration:manage")).toBe(true);
  });
  it("combines grants across multiple roles and ignores unknown roles", () => {
    expect(hasPermission(["EMPLOYEE", "MANAGER"], "team:read")).toBe(true);
    expect(hasPermission(["UNKNOWN"], "profile:read:self")).toBe(false);
  });
});
