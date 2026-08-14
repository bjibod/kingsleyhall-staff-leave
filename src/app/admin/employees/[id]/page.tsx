import { notFound, redirect } from "next/navigation";
import { canViewEmployee } from "@/features/auth/resource-policy";
import { getCurrentUser } from "@/features/auth/session";
import { resendInvitation } from "@/features/employees/onboarding-actions";
import { db } from "@/lib/db";

export default async function EmployeeDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ invitation?: string }> }) {
  const user = await getCurrentUser();
  if (!user?.employee) redirect("/login");
  const employee = await db.employee.findUnique({ where: { id: (await params).id }, include: { department: true, location: true, manager: true, user: true, workingPatterns: true, entitlements: { include: { leaveYear: true } } } });
  if (!employee || !canViewEmployee({ actorEmployeeId: user.employee.id, actorOrganisationId: user.employee.organisationId, actorRoles: user.roles }, employee)) notFound();
  const resent = (await searchParams).invitation === "resent";
  return <main className="page"><p className="eyebrow">Administration / Employees</p><div className="actions"><h1>{employee.firstName} {employee.lastName}</h1>{employee.user?.status === "INVITED" && <form action={resendInvitation}><input type="hidden" name="employeeId" value={employee.id}/><button type="submit">Resend invitation</button></form>}</div>{resent && <p role="status">A new invitation was sent. The previous link no longer works.</p>}{employee.user && <p className="muted">Account status: {employee.user.status.replaceAll("_", " ")}</p>}<section className="card-grid"><article className="card"><h2>Employment</h2><p>{employee.jobTitle}</p><p>{employee.department?.name ?? "Not assigned"} · {employee.location?.name ?? "Not assigned"}</p><p>{employee.employmentType.replaceAll("_", " ")}</p></article><article className="card"><h2>Manager</h2><p>{employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : "Not assigned"}</p></article><article className="card"><h2>Entitlement</h2>{employee.entitlements.length ? employee.entitlements.map(entitlement => <p key={entitlement.id}>{entitlement.leaveYear.name}: {Number(entitlement.entitlementHours) + Number(entitlement.carriedForwardHours) + Number(entitlement.manualAdjustmentHours)}h</p>) : <p>Not configured</p>}</article></section></main>;
}
