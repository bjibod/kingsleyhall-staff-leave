import { PrismaClient } from "@prisma/client";
import { recoveryVerificationConfig } from "../src/lib/recovery-verification";

async function main() {
  const config = recoveryVerificationConfig();
  const db = new PrismaClient({ datasources: { db: { url: config.RECOVERY_DATABASE_URL } } });
  try {
    await db.$queryRaw`SELECT 1`;
    const [organisations, users, employees, requests, auditLogs, unfinishedMigrations, missingEmployeeAccounts] = await Promise.all([
      db.organisation.count(), db.user.count(), db.employee.count(), db.leaveRequest.count(), db.auditLog.count(),
      db.$queryRaw<Array<{ count: number }>>`SELECT COUNT(*)::int AS count FROM "_prisma_migrations" WHERE finished_at IS NULL AND rolled_back_at IS NULL`,
      db.user.count({ where: { employeeId: null, status: { in: ["ACTIVE", "INVITED"] } } })
    ]);
    const report = { status: "ok", counts: { organisations, users, employees, leaveRequests: requests, auditLogs }, checks: { unfinishedMigrations: unfinishedMigrations[0]?.count ?? 0, activeAccountsWithoutEmployee: missingEmployeeAccounts } };
    if (organisations < 1 || users < 1 || report.checks.unfinishedMigrations > 0) { report.status = "failed"; process.exitCode = 1; }
    console.info(JSON.stringify(report, null, 2));
  } finally { await db.$disconnect(); }
}

main().catch(error => { console.error(JSON.stringify({ status: "failed", error: error instanceof Error ? error.name : "unknown" })); process.exitCode = 1; });
