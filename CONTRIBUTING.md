# Contributing

## Workflow

1. Start from the latest `main`.
2. Create a short-lived `feature/…`, `fix/…`, `production/…`, or `hotfix/…` branch.
3. Keep commits focused and use clear prefixes such as `feat:`, `fix:`, `test:`, `docs:`, or `chore:`.
4. Run `pnpm verify` before opening a pull request.
5. Open a pull request using the repository template and wait for required checks and review.
6. Do not merge failing, unreviewed, or security-sensitive changes without the designated approval.

Never commit environment files, passwords, API keys, employee exports, production database dumps, or private keys. Use fictional data in tests and development fixtures.

## Database changes

Change `prisma/schema.prisma`, create a reviewed migration, and explain forward/rollback implications in the pull request. Never edit the production database schema manually. Development fixture changes belong in `prisma/seed-development.ts` and must retain its safety guards.

## Reporting defects

Use GitHub Issues for ordinary defects. Report suspected security vulnerabilities privately according to `SECURITY.md`.
