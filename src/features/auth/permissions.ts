export const roles = ["EMPLOYEE", "MANAGER", "HR_ADMIN", "SUPER_ADMIN"] as const;
export type AppRole = (typeof roles)[number];

export type Permission =
  | "profile:read:self" | "leave:request:self" | "calendar:read:team"
  | "team:read" | "leave:review:reports"
  | "employee:manage" | "entitlement:manage" | "organisation:manage"
  | "role:manage" | "configuration:manage";

const grants: Record<AppRole, readonly Permission[]> = {
  EMPLOYEE: ["profile:read:self", "leave:request:self", "calendar:read:team"],
  MANAGER: ["profile:read:self", "leave:request:self", "calendar:read:team", "team:read", "leave:review:reports"],
  HR_ADMIN: ["profile:read:self", "leave:request:self", "calendar:read:team", "team:read", "leave:review:reports", "employee:manage", "entitlement:manage", "organisation:manage"],
  SUPER_ADMIN: ["profile:read:self", "leave:request:self", "calendar:read:team", "team:read", "leave:review:reports", "employee:manage", "entitlement:manage", "organisation:manage", "role:manage", "configuration:manage"]
};

export function hasPermission(userRoles: readonly string[], permission: Permission): boolean {
  return userRoles.some((role) => roles.includes(role as AppRole) && grants[role as AppRole].includes(permission));
}
