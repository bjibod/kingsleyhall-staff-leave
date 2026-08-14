export function canReviewRequest(input: { actorUserId: string; actorRoles: readonly string[]; actorEmployeeId?: string | null; requestEmployeeId: string; requestManagerId?: string | null; sameOrganisation: boolean }) {
  if (!input.sameOrganisation || input.actorEmployeeId === input.requestEmployeeId) return false;
  if (input.actorRoles.includes("SUPER_ADMIN") || input.actorRoles.includes("HR_ADMIN")) return true;
  return input.actorRoles.includes("MANAGER") && input.actorEmployeeId === input.requestManagerId;
}
