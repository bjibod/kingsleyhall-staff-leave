import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/features/auth/session";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const user = await getCurrentUser(); if (!user?.employee) redirect("/login");
  const [entitlement, approved, pending, upcoming, recent] = await Promise.all([
    db.leaveEntitlement.findFirst({ where: { employeeId: user.employee.id, leaveYear: { status: "ACTIVE" } } }),
    db.leaveRequest.aggregate({ where: { employeeId:user.employee.id,status:"APPROVED",leaveType:{deductsFromAnnualEntitlement:true}},_sum:{requestedHours:true} }),
    db.leaveRequest.aggregate({ where: { employeeId:user.employee.id,status:"PENDING",leaveType:{deductsFromAnnualEntitlement:true}},_sum:{requestedHours:true} }),
    db.leaveRequest.findMany({ where:{employeeId:user.employee.id,status:"APPROVED",endDate:{gte:new Date()}},orderBy:{startDate:"asc"},take:5 }),
    db.leaveRequest.findMany({ where:{employeeId:user.employee.id},orderBy:{createdAt:"desc"},take:5,include:{leaveType:true} })
  ]);
  const total = entitlement ? Number(entitlement.entitlementHours)+Number(entitlement.carriedForwardHours)+Number(entitlement.manualAdjustmentHours) : 0; const used=Number(approved._sum.requestedHours??0); const booked=Number(pending._sum.requestedHours??0);
  return <AppShell roles={user.roles}><main className="page"><section className="welcome"><div className="welcome-copy"><p className="eyebrow">Staff leave dashboard</p><h1>Welcome back, {user.employee.firstName}</h1><p className="muted">Plan your time away and keep track of every request in one place.</p></div><div className="welcome-art" aria-hidden="true"><span>LIVE</span><strong>WELL</strong></div></section><section className="card-grid"><article className="card"><h2>Annual entitlement</h2><p className="metric">{total}h</p><small>Your allowance this leave year</small></article><article className="card"><h2>Approved / taken</h2><p className="metric">{used}h</p><small>Confirmed time away</small></article><article className="card"><h2>Awaiting approval</h2><p className="metric">{booked}h</p><small>Requests with your manager</small></article><article className="card"><h2>Available to book</h2><p className="metric">{total-used}h</p><small>Your current balance</small></article></section><a className="primary-cta" href="/leave/request"><button>Request leave</button></a><h2 className="section-heading">Upcoming leave</h2>{upcoming.length ? <RequestTable rows={upcoming}/> : <div className="card empty-state"><span className="empty-icon" aria-hidden="true">KH</span><h2>No upcoming leave</h2><p className="muted">When leave is approved, you’ll see it here.</p></div>}<h2 className="section-heading">Recent requests</h2><RequestTable rows={recent}/></main></AppShell>;
}

function RequestTable({rows}:{rows:Array<{id:string;startDate:Date;endDate:Date;requestedHours:unknown;status:string}>}){return <div className="table-wrap"><table><thead><tr><th>From</th><th>To</th><th>Hours</th><th>Status</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.startDate.toLocaleDateString("en-GB")}</td><td>{r.endDate.toLocaleDateString("en-GB")}</td><td>{Number(r.requestedHours)}</td><td><span className="badge" data-status={r.status}>{r.status}</span></td></tr>)}</tbody></table></div>}
