export type EmployeeAccessContext = { actorEmployeeId: string; actorOrganisationId: string; actorRoles: readonly string[] };
export type EmployeeResource = { id: string; organisationId: string; managerId?: string | null };

export function canViewEmployee(context: EmployeeAccessContext, employee: EmployeeResource): boolean {
  if (context.actorOrganisationId !== employee.organisationId) return false;
  if (context.actorEmployeeId === employee.id) return true;
  if (context.actorRoles.some(role => role === "HR_ADMIN" || role === "SUPER_ADMIN")) return true;
  return context.actorRoles.includes("MANAGER") && employee.managerId === context.actorEmployeeId;
}

export function canManageEmployee(context: EmployeeAccessContext, employee: EmployeeResource): boolean {
  return context.actorOrganisationId === employee.organisationId && context.actorEmployeeId !== employee.id
    && context.actorRoles.some(role => role === "HR_ADMIN" || role === "SUPER_ADMIN");
}
