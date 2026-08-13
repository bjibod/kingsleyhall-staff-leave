# Release 1 Report

## Features delivered

- Secure email/password login, hashed opaque sessions, four additive roles and protected server routes.
- Tenant-ready organisation, location, department, employee, manager and effective working-pattern schema.
- Hours-first leave engine covering variable days, non-working days, half days, bank holidays, overlaps, entitlement and potential balance.
- Employee balance dashboard, request flow, request history, profile, notifications and privacy-aware calendar.
- Scoped manager queue and review screen with balance, overlap context, approve/reject reason, audit and notification transaction.
- Admin dashboards for employees, organisation reference data, leave configuration, bank holidays, reports, CSV and append-only audit viewing.
- PostgreSQL migration, 15-person demo seed, environment template, Docker deployment and architecture documentation.

## Features deferred or requiring completion

- The employee-create screen currently documents the invitation boundary but does not yet submit a staff creation transaction.
- Admin edit/disable, entitlement-adjustment and bank-holiday mutation forms require implementation.
- Email provider abstraction exists; workflow delivery is not yet connected to an asynchronous retry queue.
- Full password-reset token workflow, rate limiting, integration/E2E/browser accessibility testing and production error-monitoring integration remain.

## Test results

- 21 unit and permission tests pass across leave calculations, overlaps, balance rules, sessions, RBAC and approval scope.
- Prisma schema validation/client generation, ESLint, TypeScript and Next.js production compilation pass.
- Live PostgreSQL migration/seed and the specified browser E2E journey were not executable because no PostgreSQL service is attached.

## Security measures

Bcrypt cost 12, hashed opaque sessions, HttpOnly/SameSite cookies, server-side permission checks, organisation scoping, manager hierarchy checks, self-approval denial, Zod validation, security headers, no plaintext invitation passwords and append-only audit writes.

## Known limitations

Bank-holiday inclusion policy is currently treated as separate from annual leave and must be confirmed. Employee calendar names remain hidden. Approved leave cancellation creates a cancellation request but its manager completion UI is pending.

## Deployment

Use the Dockerfile or a Node 22 host with managed PostgreSQL, HTTPS and the variables in `.env.example`. Run `prisma migrate deploy` then `prisma db seed` for a demo environment. Configure backups, error monitoring and an email API before production use.

## Business decisions still required

See `DECISIONS.md`: bank-holiday policy, leave-year start, calendar privacy, overbooking authority, cancellation workflow and half-day policy.

## Release 2 recommendations

Complete the remaining Release 1 mutation/E2E work first, then add calendar integrations, staffing controls, enhanced absence tracking and mobile push notifications behind the existing service boundaries.
