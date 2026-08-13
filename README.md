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
5. Run `pnpm db:seed`.
6. Run `pnpm dev` and open `http://localhost:3000`.

## Demo account

The Phase 1 seed creates `admin@kingsleyhall.test` with temporary password `Demo-Change-Me-2026!`. This is development data only; never use it in production.

## Testing and production build

Run `pnpm test`, `pnpm lint`, and `pnpm build`. Production requires HTTPS, a persistent managed PostgreSQL database, secure environment secrets, backups and central error logging. Run checked-in migrations during deployment before starting the application.

## Current delivery status

Phase 1 foundation is complete. The leave engine and operational dashboards are intentionally not represented as complete. See [BUILD_PROGRESS.md](BUILD_PROGRESS.md), [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md), and [DECISIONS.md](DECISIONS.md).
