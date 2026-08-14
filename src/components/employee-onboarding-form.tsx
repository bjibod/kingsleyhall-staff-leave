"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createEmployee } from "@/features/employees/onboarding-actions";

type Option = { id: string; name: string };
export function EmployeeOnboardingForm({ locations, departments, managers }: { locations: Option[]; departments: Option[]; managers: Array<Option & { employeeNumber: string }> }) {
  const [state, action, pending] = useActionState(createEmployee, {});
  return <form action={action} className="form-stack card">
    <div className="two-col"><label>Employee number<input name="employeeNumber" required maxLength={30} /></label><label>Work email<input name="workEmail" type="email" autoComplete="email" required /></label></div>
    <div className="two-col"><label>First name<input name="firstName" autoComplete="given-name" required /></label><label>Last name<input name="lastName" autoComplete="family-name" required /></label></div>
    <div className="two-col"><label>Job title<input name="jobTitle" required /></label><label>Start date<input name="startDate" type="date" required /></label></div>
    <div className="two-col"><label>Employment type<select name="employmentType" required defaultValue="FULL_TIME"><option value="FULL_TIME">Full time</option><option value="PART_TIME">Part time</option><option value="TERM_TIME">Term time</option><option value="FIXED_TERM">Fixed term</option><option value="OTHER">Other</option></select></label><label>Manager<select name="managerId" defaultValue=""><option value="">Not assigned</option>{managers.map(x => <option key={x.id} value={x.id}>{x.name} ({x.employeeNumber})</option>)}</select></label></div>
    <div className="two-col"><label>Department<select name="departmentId" defaultValue=""><option value="">Not assigned</option>{departments.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Location<select name="locationId" defaultValue=""><option value="">Not assigned</option>{locations.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label></div>
    {state.error && <p className="error" role="alert">{state.error}</p>}
    <div className="actions"><Link href="/admin/employees">Cancel</Link><button type="submit" disabled={pending}>{pending ? "Creating..." : "Create employee and send invitation"}</button></div>
  </form>;
}
