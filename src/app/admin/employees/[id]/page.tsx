import { notFound, redirect } from "next/navigation";
import { canViewEmployee } from "@/features/auth/resource-policy";
import { getCurrentUser } from "@/features/auth/session";
import { db } from "@/lib/db";

export default async function EmployeeDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.employee) redirect("/login");
  const employee = await db.employee.findUnique({
    where: { id: (await params).id },
    include: { department: true, location: true, manager: true, workingPatterns: true, entitlements: { include: { leaveYear: true } } }
  });
  if (!employee || !canViewEmployee({ actorEmployeeId: user.employee.id, actorOrganisationId: user.employee.organisationId, actorRoles: user.roles }, employee)) notFound();
  return <main className="page"><p className="eyebrow">Administration / Employees</p><h1>{employee.firstName} {employee.lastName}</h1><section className="card-grid"><article className="card"><h2>Employment</h2><p>{employee.jobTitle}</p><p>{employee.department?.name} · {employee.location?.name}</p><p>{employee.employmentType.replaceAll("_", " ")}</p></article><article className="card"><h2>Manager</h2><p>{employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : "Not assigned"}</p></article><article className="card"><h2>Entitlement</h2>{employee.entitlements.map(entitlement => <p key={entitlement.id}>{entitlement.leaveYear.name}: {Number(entitlement.entitlementHours) + Number(entitlement.carriedForwardHours) + Number(entitlement.manualAdjustmentHours)}h</p>)}</article></section></main>;
}
