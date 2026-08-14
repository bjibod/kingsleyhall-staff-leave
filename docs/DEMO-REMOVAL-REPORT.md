# Demo Removal Report

Date: 14 August 2026  
Branch: `production/remove-demo`

## Removed

- Removed the shared demo password from source and documentation.
- Removed the generic `db:seed` command that could be mistaken for production initialisation.
- Removed Prisma's implicit package-level seed configuration.
- Removed UI wording that directed administrators to rely on seeded staff.
- Removed complete email recipient/body content from development logs.

## Replaced

- Replaced `prisma/seed.ts` with the explicitly named `prisma/seed-development.ts` fixture command.
- Added mandatory `ALLOW_DEMO_SEED=true` confirmation.
- Added a caller-supplied `DEMO_SEED_PASSWORD` with a minimum length of 14 characters.
- Restricted development fixture seeding to non-production mode and loopback PostgreSQL hosts.
- Added `db:migrate:deploy` as the production-safe migration command.
- Made email provider selection explicit and prohibited console delivery in production.
- Added regression tests for seed and email environment safeguards.

## Still outstanding

- Secure invitation and password-reset flows are not implemented; production onboarding remains disabled.
- The fictional development dataset remains intentionally available for local development behind the new safeguards.
- A production transactional email provider has not been selected or configured.
- Environment validation should be centralised during architecture hardening.
- The previously published demo credential must be considered permanently compromised and must never be reused.

## Production blockers

- Production administrator onboarding requires the invitation/reset work scheduled for security hardening.
- Staging and production must use separate managed PostgreSQL databases and separate secrets.
- Deployment automation must run `prisma migrate deploy` and must never run development fixture seeding.
- The remaining Critical/High findings in `PRODUCTION-AUDIT.md` still block production.

## Verification

- Seed safeguards have unit coverage for production, explicit opt-in, remote database, and password-length rejection.
- Email safeguards have unit coverage for production console rejection and incomplete/unknown provider configuration.
- Application tests, lint, Prisma generation, type checking, and production build must pass before merge.
