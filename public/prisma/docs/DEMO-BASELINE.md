# Kingsley Hall Staff Leave — Demo Baseline

Preservation date: 13 August 2026  
Baseline version: `0.1.0`  
Purpose: immutable record of the working demonstration before production migration.

## Current state

The application is a functioning local demonstration. It is not approved for production use. It runs as a full-stack Next.js application backed by local PostgreSQL and uses Prisma for persistence and migrations.

| Area | Baseline implementation |
|---|---|
| Framework | Next.js 16.3, React 19.2, TypeScript 5.9 |
| Package manager | pnpm with committed lockfile |
| Entry points | App Router under `src/app`; server actions under feature modules; `src/proxy.ts` protects route groups |
| Database | PostgreSQL 15.18 locally on port 5433, database `kingsley_leave` |
| ORM/migrations | Prisma 6.19; one tracked baseline migration |
| Authentication | Email/password, bcrypt cost 12, opaque database-backed sessions stored as SHA-256 hashes |
| Authorisation | Additive EMPLOYEE, MANAGER, HR_ADMIN and SUPER_ADMIN roles; manager approval hierarchy policy |
| Email | Provider abstraction; console mode by default and generic HTTP provider option; workflow delivery is incomplete |
| External services | None required for the local demo; Google Fonts are referenced by CSS at runtime |
| Tests | Vitest unit and permission tests |
| Hosting | Standalone Next.js Dockerfile only; no live hosting or CI/CD configuration |
| Branding | Kingsley Hall wordmark and website-inspired visual system |

## Environment variables

Required or supported variable names are documented in `.env.example`: `DATABASE_URL`, `AUTH_SECRET`, `APP_URL`, `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_API_URL`, `EMAIL_FROM`, and `NODE_ENV`. No real `.env` file is part of this baseline.

## Working demo functionality

- Responsive branded login and logout.
- Employee dashboard with entitlement, approved, pending and remaining hours.
- Hours-first leave calculation for variable patterns, weekends, half days and configured bank holidays.
- Leave request submission with overlap and insufficient-balance checks.
- Manager review, hierarchy checks, self-approval denial, approval and rejection.
- Privacy-limited team calendar.
- In-app notifications and audit records for core leave workflow events.
- Read-oriented employee, location, department, leave-year, leave-type and bank-holiday administration pages.
- Leave balance report and CSV export.
- Demo seed containing 15 fictional users and three example leave requests.

## Unfinished functionality

- Employee creation/edit/disable transactions and secure invitation delivery.
- Entitlement adjustment and organisation-setting mutation forms.
- Bank-holiday/leave-type/leave-year mutation forms.
- Password-reset token generation and email flow.
- Production email retry/delivery integration.
- Approved-leave cancellation review completion.
- Rate limiting, health endpoint, monitoring, staging and deployment workflows.
- Database-backed integration tests, browser E2E tests and completed accessibility testing.

## Database baseline

- Engine: PostgreSQL 15.18.
- Schema source: `prisma/schema.prisma`.
- Migration: `prisma/migrations/20260812142500_foundation/migration.sql`.
- Seed: `prisma/seed.ts`.
- Local demo data at preservation time: 15 fictional employees/users and three fictional leave requests.
- The seed is development-only in intent but currently lacks a production execution guard.
- No personal production data is copied into this document or Git history.

## Known demo accounts

The seed creates fictional accounts under the reserved `.test` domain for EMPLOYEE, MANAGER, HR_ADMIN and SUPER_ADMIN roles. A shared plaintext demo password currently appears in the development seed and earlier documentation. Its value is deliberately not repeated here. It must be treated as compromised and removed during the dedicated demo-removal stage.

## Secrets review

The scan reported credential-shaped references, not proof that every match is a secret.

| File/location | Credential type | Finding and remediation |
|---|---|---|
| `prisma/seed.ts`, near line 5 | Demo password | Plaintext development credential. Production blocker; separate development seed and replace production onboarding with invitation/reset/SSO. |
| `README.md`, demo account section | Demo password | Public documentation repeats the development credential. Remove during demo-removal and treat it as compromised. |
| `.env.example`, lines 1–7 | Environment placeholders | Expected placeholders only; retain without live values. |
| `src/services/email.ts`, environment lookups | Email API key/sender | Reads environment variables; no key value stored. Ensure production secret management later. |
| `src/features/auth/session.ts` and schema/migration | Session token fields | Token hashes and token handling code, not embedded live tokens. |

No local PostgreSQL password, live API key, private key, SMTP credential or production session secret was found in legitimate source files. `node_modules`, `.next`, `work`, `outputs` and local environment files are excluded from Git.

## Obvious security and operational concerns

- Demo credentials are known and reusable.
- Password reset and secure invitations are incomplete.
- Login rate limiting and lockout controls are absent.
- Middleware checks cookie presence only; definitive session checks occur in pages/actions, but systematic route/API tests are incomplete.
- Some admin pages are read-only placeholders and therefore do not meet Release 1 operational acceptance criteria.
- Email delivery is not durable and lacks retry processing.
- No CI, staging, monitoring, managed backups or production secret store exists.
- One broad initial migration represents the current schema; migration behavior has not been exercised in a clean CI database.
- Automated tests cover core calculations and permission helpers but not complete database transactions or browser journeys.

## Known defects

- The local preview stops when its Codex process ends; it is not a persistent deployment.
- Approved cancellation creates a request timestamp but lacks the manager completion UI.
- Report filtering is incomplete.
- The administration “Add employee” page is informational rather than functional.
- CSS imports remote fonts, so typography falls back when internet access is unavailable.

## Preservation point

Git was not present before this stage. An empty repository was initialized with intended default branch `main`, but the managed Codex sandbox cannot write Git index/config lock files because the project belongs to the interactive Windows user. Consequently, no commit, tag or archive branch has been created yet. No remote is configured and no production architecture changes were made.

The repository owner must complete these commands from a normal terminal in this directory:

```powershell
git add --all
git commit -m "chore: preserve working demo baseline"
git tag -a demo-baseline-2026 -m "Preserved Kingsley Hall Staff Leave demo baseline"
git branch archive/demo-baseline
```

Before committing, verify `git status --short` does not include `.env`, `.next`, `node_modules`, `outputs` or `work`.

## Baseline verdict

The application inventory is preserved, but the immutable Git preservation point is not complete. Do not begin Stage 1 until the baseline commit, tag and archive branch have been created and verified. The demo is **not suitable for production deployment** in this state.
