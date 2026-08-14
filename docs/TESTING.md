# Testing strategy

## Automated quality gate

Every push to `main`, `develop`, or `production/**` and every pull request to `main` runs the following checks in GitHub Actions:

1. Install the exact lockfile dependencies.
2. Start an isolated PostgreSQL 16 service and apply every production migration.
3. Generate the Prisma client.
4. Run ESLint and strict TypeScript checks.
5. Run unit, security, permission, transaction, and database lifecycle tests.
6. Produce the optimized standalone application build.
7. Fail on high-severity production dependency advisories.

The CI database contains only fictional data created during that run. It is never shared with staging or production.

## Coverage map

| Risk | Automated evidence |
| --- | --- |
| Entitlement, carry-forward, adjustments and remaining balance | `leave-calculation.test.ts` |
| Working patterns, weekends, half-days and bank holidays | `leave-calculation.test.ts` |
| Invalid dates, overlap and insufficient balance | `leave-calculation.test.ts`, `leave-validation.test.ts` |
| Pending and approved cancellation rules | `cancellation-policy.test.ts` |
| Employee, manager, HR and super-admin boundaries | `permissions.test.ts`, `resource-policy.test.ts`, `approval-policy.test.ts` |
| Session/reset/invitation token protection and login throttling | `session.test.ts`, `auth-security.test.ts`, `invitation.test.ts` |
| Transaction retry behavior | `transaction.test.ts` |
| PostgreSQL authentication records, approval, rejection, cancellation, entitlement adjustment and audit persistence | `database-lifecycle.integration.test.ts` |

Run the fast suite locally with `pnpm test`. Run database integration tests against a disposable migrated database with `RUN_DATABASE_TESTS=true pnpm test`. Never point integration tests at staging or production.

## Staging browser journeys

These journeys require a deployed HTTPS origin, working transactional email, and disposable fictional users, so they run during Stage 10 staging/UAT rather than against a developer's database.

1. Employee signs in, opens the dashboard, requests leave and sees a pending request.
2. The assigned manager signs in, reviews the employee balance, approves the request and sees approved status.
3. The employee signs in again and sees the reduced remaining balance.
4. An employee directly opens `/admin`; the application redirects them to `/dashboard` and no administration data is returned.
5. HR creates a fictional employee, the recipient activates the single-use invitation, signs in, then resets their password; the old session and reused tokens fail.

Record the build commit, browser, tester, timestamp and outcome for every UAT run. A failed journey blocks production promotion and should receive an automated regression test where practical.

## Regression policy

Every production defect must be reproduced before correction and receive a focused regression test whenever the behavior can be automated reliably. Tests must assert business outcomes or security boundaries; snapshots and count-only tests are not accepted as substitutes.
