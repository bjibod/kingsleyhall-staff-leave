# Database Migration Procedure

## Environments

Use different databases and secrets for development, staging, and production. Never test a migration first against production and never run development fixtures outside a local disposable database.

## Preflight for database-hardening migration

Run read-only checks for:

- employees whose end date precedes start date;
- invalid working-pattern hours or effective date ranges;
- leave years whose end precedes start;
- more than one active leave year per organisation;
- negative effective entitlement;
- leave requests with reversed dates or non-positive hours.

Resolve every returned row through an approved, auditable data-correction process before deployment. Do not silently delete or rewrite staff records.

## Deployment

1. Confirm a recent successful backup and documented restore point.
2. Record application version, database target, migration name, operator, and approval.
3. Put conflicting administration changes on hold.
4. Run `pnpm db:migrate:deploy` using the migration identity.
5. Verify Prisma migration status and application health.
6. Execute smoke tests for login, employee self-scope, manager scope, request submission, approval, rejection, and reports.
7. Monitor database errors, latency, connections, and application exceptions.

## Rollback

Application rollback does not automatically reverse database changes. This migration adds constraints, indexes, timestamps, and an append-only trigger; it does not delete application data. If rollback is required, prefer fixing forward. Removing a constraint or trigger requires a separately reviewed SQL migration and explicit security/data-owner approval.

## Verification still required

The migration must be applied to an isolated staging clone and exercised with PostgreSQL-backed integration and concurrency tests before production approval. A schema validation or generated Prisma Client alone is not evidence that a live migration succeeded.
