# Kingsley Hall Staff Leave

Internal holiday and leave booking, approval and management for Kingsley Hall staff.

## Technology and architecture

Next.js, React, TypeScript, PostgreSQL, Prisma, Zod, bcrypt and Vitest. See [ARCHITECTURE.md](ARCHITECTURE.md), [DATABASE_ERD.md](DATABASE_ERD.md), and [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md).

## Requirements

- Node.js 20+
- PostgreSQL 15+
- pnpm 9+

## Local setup

1. Copy `.env.example` to `.env` and replace `AUTH_SECRET`.
2. Create the PostgreSQL database referenced by `DATABASE_URL`.
3. Run `pnpm install`.
4. Run `pnpm db:migrate --name foundation`.
5. To create fictional local fixtures only, set `ALLOW_DEMO_SEED=true`, choose a unique `DEMO_SEED_PASSWORD` of at least 14 characters, and run `pnpm db:seed:development`. The command refuses production and non-local database URLs.
6. Run `pnpm dev` and open `http://localhost:3000`.

## Development fixtures

Development fixtures use fictional `.test` accounts and the locally supplied `DEMO_SEED_PASSWORD`. No demo password is stored in source. Never reuse a development password or run fixture seeding against staging or production.

## Testing and production build

Run `pnpm test`, `pnpm lint`, and `pnpm build`. Production requires HTTPS, a persistent managed PostgreSQL database, secure environment secrets, backups and central error logging. Run `pnpm db:migrate:deploy` during deployment. Production administrators must be onboarded through the secure invitation/reset workflow once implemented; fixture seeding is not a production initialisation mechanism.

## Current delivery status

Phase 1 foundation is complete. The leave engine and operational dashboards are intentionally not represented as complete. See [BUILD_PROGRESS.md](BUILD_PROGRESS.md), [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md), and [DECISIONS.md](DECISIONS.md).
