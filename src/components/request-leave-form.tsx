"use client";
import { useActionState } from "react";
import { submitLeaveRequest } from "@/features/leave/actions";

export function RequestLeaveForm({ leaveTypes }: { leaveTypes: { id:string; name:string }[] }) {
  const [state, action, pending] = useActionState(submitLeaveRequest, { error: undefined });
  return <form action={action} className="form-stack card">
    <label>Leave type<select name="leaveTypeId" required>{leaveTypes.map(t => <option value={t.id} key={t.id}>{t.name}</option>)}</select></label>
    <div className="two-col"><label>Start date<input type="date" name="startDate" required /></label><label>End date<input type="date" name="endDate" required /></label></div>
    <label>Employee note (optional)<textarea name="employeeNote" rows={4} maxLength={1000} /></label>
    <p className="muted">Your scheduled hours, non-working days and configured bank holidays are calculated when you submit.</p>
    {state.error && <p className="error" role="alert">{state.error}</p>}<button disabled={pending}>{pending ? "Submitting…" : "Confirm and submit request"}</button>
  </form>;
}
