# Continuous Integration

`.github/workflows/ci.yml` runs on pull requests to `main`, pushes to `main`/`develop`, and production-preparation branches.

The `validate` job uses Node.js 22 and pnpm 9.15.9, installs the exact lockfile, generates Prisma Client, lints, type-checks, runs unit tests, creates a production build, and audits production dependencies for high/critical advisories. Any failure fails the job.

Workflow permissions are read-only. CI uses non-production placeholder environment values and never seeds data. No production credential belongs in workflow YAML.

Database integration tests are not yet implemented; the CI database URL is reserved for that later job. Deployment is deliberately absent until staging, UAT, hosting, database migration, and rollback controls are designed.

## Required GitHub administration

After the first successful run, add the `validate` job as a required `main` status check. Enable Dependabot alerts and private vulnerability reporting. Store future staging/production secrets in separate GitHub Environments, never repository files.
