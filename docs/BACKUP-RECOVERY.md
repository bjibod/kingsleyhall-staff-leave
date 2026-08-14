# Backup and disaster recovery

## Objectives requiring management approval

The recommended initial **Recovery Point Objective (RPO)** is **15 minutes**: at most 15 minutes of successfully committed production changes may be lost. The recommended initial **Recovery Time Objective (RTO)** is **4 hours** from incident declaration to a verified service being available. These are engineering recommendations, not approved business commitments; Kingsley Hall management must accept or revise them after assessing operational impact, provider cost and staff leave-processing contingencies.

During an outage, HR maintains an access-controlled temporary record of urgent leave decisions and enters them into the restored system after reconciliation. Email or unsecured spreadsheets must not become an alternative staff database.

## Protected assets

| Asset | Protection and recovery source | Owner role |
| --- | --- | --- |
| Production PostgreSQL | Managed encrypted backups and point-in-time recovery (PITR), in a separate provider failure domain where available | Database/technical operator |
| Application source and migrations | Protected private GitHub repository, immutable commits/tags and branch controls | Repository administrator |
| Environment configuration | Vercel/GitHub/Sentry/email secret stores plus an offline access-controlled inventory of variable names and owners | System owner |
| Hosting configuration | `vercel.json`, workflows and documented project/domain settings | Deployment operator |
| DNS/domain | Registrar account with MFA, recovery contacts and recorded DNS configuration | Domain administrator |
| Monitoring and email settings | Provider projects, verified domains and alert/runbook documentation | Technical operator |
| Uploaded files | None currently used; public brand assets are versioned in Git. Any future user-upload feature requires its own encrypted, versioned backup policy before launch | Application owner |

GitHub is version control, not a substitute for database backups. Environment-variable examples contain names only; secret values must not be committed or placed in restore records.

## Database backup policy

Configure the selected managed PostgreSQL provider before production launch with:

- continuous transaction-log/PITR coverage sufficient for the 15-minute RPO;
- automated daily recovery points retained for at least 35 days;
- monthly recovery points retained for 12 months if provider capability and approved retention policy allow;
- encryption in transit and at rest, restricted backup administration and MFA;
- automated alerts for failed backups, replication lag, storage exhaustion and loss of PITR coverage;
- a documented region/provider failure option appropriate to the agreed RTO;
- deletion/retention controls aligned with employment-record and UK data-protection requirements.

The database owner must record the actual provider, plan, region, retention, PITR window and support route in the restricted operations inventory. Do not claim these controls are active until the provider dashboard and a restore test prove them.

## Recovery decision and roles

| Role | Responsibility |
| --- | --- |
| Incident lead | Declares incident, controls communications, chooses recover/rollback and records timings |
| Database operator | Selects recovery point, restores to a new isolated database and preserves the failed source |
| Deployment operator | Repoints a staged application, manages Vercel promotion/rollback and validates health |
| Security/privacy lead | Assesses compromise, credentials, reportability and access to restored personal data |
| HR/UAT representative | Verifies staff/leave outcomes and coordinates manual-operation reconciliation |

Use named deputies and an out-of-band contact list stored in the restricted operations inventory. No individual should approve their own destructive recovery operation when another authorised responder is available.

## Failure scenarios

| Failure scenario | Recovery action | Responsible role | Verification |
| --- | --- | --- | --- |
| Bad application release; database healthy | Vercel instant rollback to last known-good immutable release | Deployment operator | Live SHA, health, login and read-only leave checks |
| Faulty backward-compatible migration | Stop promotion/writes, restore pre-migration point to a new DB if data was affected, deploy compatible prior release | Incident lead + database operator | Migration history, restored counts, business reconciliation |
| Accidental deletion/corruption | Preserve evidence, select point immediately before event, PITR to a new DB, verify, then switch | Database operator | Recovery verifier, sampled audit/leave balances, RPO calculation |
| Database region/provider outage | Activate provider failover or restore latest recovery point in approved alternate location | Database operator | Connectivity, health, RPO/RTO and application journeys |
| Credential compromise | Revoke/rotate affected secrets, terminate sessions where applicable, restore only if data integrity changed | Security lead | Old credentials fail, sessions reviewed, audit/monitoring checked |
| GitHub unavailable | Operate current deployed build; use documented immutable release and protected emergency copy only for recovery | Repository administrator | Commit provenance and CI before next promotion |
| Vercel/domain failure | Follow provider incident process or deploy the tested standalone container to approved contingency hosting and update DNS under change control | Deployment + domain operators | TLS, DNS, health, environment and release SHA |
| Sentry/email outage | Continue core leave operations using in-app records; do not repeatedly resubmit transactions | Technical operator | Provider recovery, bounded resend and missing-event review |
| Ransomware or malicious alteration | Isolate accounts/systems, preserve logs, rotate credentials, restore a known-clean point to new infrastructure | Incident + security leads | Clean credentials, integrity checks, security approval |

## Restoration procedure

1. Open an incident record, note detection time, last known-good transaction time, affected systems and decision roles. Restrict changes while recovery is assessed.
2. Preserve the failed database and relevant provider/audit logs. Do not overwrite the source or delete evidence.
3. Choose a recovery timestamp based on audit evidence and the business owner’s acceptable data-loss point.
4. Restore the backup/PITR point to a **new non-production database instance** with new credentials and network restrictions. Never test by overwriting production.
5. Check out the matching immutable application commit and review all migrations between that release and the recovered schema.
6. Set only on the isolated operator machine: `DEPLOYMENT_ENV=recovery-test`, `RECOVERY_VERIFICATION=true`, `RECOVERY_TARGET_CONFIRMED_NON_PRODUCTION=true`, and `RECOVERY_DATABASE_URL=<restored database>`.
7. Run `pnpm db:verify-recovery`. It performs read-only connectivity, migration and aggregate integrity checks and prints counts only—not staff records. Any failed status blocks cutover.
8. Deploy the matching application release to a protected recovery/staging origin with email disabled or restricted to authorised testers and Sentry tagged `recovery-test`.
9. Verify `/api/health`, administrator login, employee/manager permission boundaries, leave balance samples, pending/approved/rejected/cancelled requests, audit history and reports with HR. Compare aggregate counts and the selected recovery timestamp.
10. Calculate actual data loss and elapsed recovery time. If evidence does not meet the proposed RPO/RTO, escalate before cutover.
11. Rotate database credentials, set production secret stores to the verified restored database, promote the verified release and monitor closely. Retain the old database read-only according to incident/legal guidance.
12. Reconcile authorised manual leave decisions created during the outage, using four-eyes review and audit entries.
13. Complete `docs/RESTORE-TEST-RECORD.md`, record corrective work and obtain incident/management closure.

## Restoration tests

Run a full restore drill before first production launch, quarterly thereafter, and after a database-provider, region, encryption, retention or major schema change. A successful drill requires an actual provider restore to isolated infrastructure—not merely seeing a “backup succeeded” badge.

Every drill must verify backup accessibility, credentials, application/schema compatibility, aggregate integrity, key user journeys, permission boundaries, monitoring, email isolation, actual RPO and actual RTO. Store sanitized evidence in the restricted operations record; never attach raw exports or personal records to GitHub issues.

Review this plan at least every six months and after every incident or failed drill. Changes to RPO, RTO, retention, responsible roles or providers require management approval and an updated test.
