# Vercel production deployment

## Decision

Vercel is appropriate for this application because it is a native Next.js service, uses standard Node.js APIs, and keeps durable state in PostgreSQL. `vercel.json` selects the Next.js framework, locked pnpm installation, the existing production build, and the London function region (`lhr1`) so the managed database should also be hosted in or near London. Docker remains supported for staging and portability; `next.config.ts` disables standalone output only inside Vercel's build environment.

Production release is deliberately two-phase: Vercel creates a **staged** production deployment without attaching the live domain, then a human promotes it only after CI, database migration and health verification. A build failure or unhealthy deployment must never be called a successful release.

## One-time Vercel project setup

1. In Vercel, add a new project and import `bjibod/kingsleyhall-staff-leave` from GitHub. Do not enter a GitHub or Vercel token into source files.
2. Keep the repository root as the project root. Confirm Framework Preset **Next.js**, Install Command `corepack enable && pnpm install --frozen-lockfile`, Build Command `pnpm build`, and Node.js **22.x**. The repository's `vercel.json` is authoritative for the commands and `lhr1` region.
3. Under **Settings → Environments → Production → Branch Tracking**, select `main` as the production branch and disable **Auto-assign Custom Production Domains**. New main builds must remain staged until explicitly promoted.
4. Keep GitHub preview deployments enabled for pull requests. Use Preview environment variables only; never expose production database, authentication, email or monitoring credentials to a preview.
5. Add the approved live hostname under **Settings → Domains**, complete DNS ownership verification, and enforce HTTPS. Do not promote a deployment until the domain and certificate are ready.
6. Under **Settings → Environment Variables**, create the names from `.env.production.example` scoped only to **Production**. Set `DEPLOYMENT_ENV=production`. Use an independently generated `AUTH_SECRET` and a production PostgreSQL connection that requires TLS.
7. Create separate Preview variables with `DEPLOYMENT_ENV=preview`, a disposable/non-production PostgreSQL database, a different `AUTH_SECRET`, a sandbox email provider and a preview URL. Restrict preview email recipients. Do not import Production variables into Preview.
8. In GitHub **Settings → Environments**, create `production`, require an authorised reviewer, prevent self-review where supported, restrict it to `main`, and add the `PRODUCTION_DATABASE_URL` secret. This must identify the same production database configured in Vercel.
9. In Vercel deployment protection/check settings, require the repository CI checks before promotion. Protect preview and staged deployment URLs from public access where the plan permits.

## Required environment variables

| Variable | Preview | Production |
| --- | --- | --- |
| `DEPLOYMENT_ENV` | `preview` | `production` |
| `APP_URL` | Stable preview/test origin | Canonical live HTTPS origin |
| `DATABASE_URL` | Preview-only PostgreSQL | Production-only PostgreSQL |
| `AUTH_SECRET` | Preview-only random secret | Production-only random secret |
| `EMAIL_PROVIDER` | Sandbox/restricted | Approved live provider |
| `EMAIL_API_URL` | Sandbox endpoint | Production endpoint |
| `EMAIL_API_KEY` | Preview secret | Separate production secret |
| `EMAIL_FROM` | Clearly marked test sender | Approved Kingsley Hall sender |
| `APP_NAME`, `ORGANISATION_NAME`, `APP_TIMEZONE` | Non-secret configuration | Non-secret configuration |

Vercel supplies `VERCEL_GIT_COMMIT_SHA`; `/api/health` uses it as the release identifier. Do not manually set `NODE_ENV` in Vercel unless the platform requires it.

## Release procedure

1. Complete staging UAT for a full commit SHA and obtain recorded approval.
2. Merge only that tested commit lineage to `main`; confirm the GitHub `CI` workflow passes.
3. In Vercel **Deployments**, wait for the matching production deployment to reach **Ready**. Because domain auto-assignment is disabled, it must show as staged and must not yet serve the live domain.
4. Inspect build logs and confirm the source SHA, Node version, Next.js framework and London function region. A failed/cancelled build stops the release.
5. In GitHub **Actions → Production database migration → Run workflow**, enter the same full SHA. The protected production environment requires approval before applying `prisma migrate deploy`.
6. Open the staged deployment URL's `/api/health` endpoint (use Vercel's authenticated request tooling if deployment protection is enabled). Require HTTP 200 with `status: "ok"`, `environment: "production"`, and the expected SHA in `release`.
7. Run the critical smoke checks: login, employee dashboard, leave request, manager review, admin access denial for an employee, invitation email and password reset. Use authorised test accounts and do not alter real leave records.
8. Review server/function logs for new errors. If any critical check fails, leave the deployment staged, raise an incident/bug, and do not describe it as released.
9. From the staged deployment menu, choose **Promote to Production** and confirm the approved live domains. Promotion assigns domains without rebuilding the tested artifact.
10. Recheck the live `/api/health`, the login page and one authenticated read-only journey. Record SHA, deployment URL, approver, time and outcomes in the release record.

## Rollback

1. If the live application is unhealthy, use Vercel **Deployments** to select the last known-good production deployment and choose **Rollback**, or use `vercel rollback` from an authenticated operator workstation.
2. Confirm the live domain now reports the previous release SHA and healthy database status.
3. Do not reverse database migrations automatically. Releases must use backward-compatible expand/contract migrations. If a data migration caused damage, stop writes and follow the database restore runbook using a new restored database before changing `DATABASE_URL`.
4. Record the incident and add a regression test before retrying production.

## Operational notes

- `/api/health` performs a minimal database query and returns only status, environment and release; it never exposes connection details.
- Vercel function logs and analytics are not a substitute for Stage 12 application monitoring and alerting.
- Current Vercel guidance for [Git deployments](https://vercel.com/docs/git), [environment separation](https://vercel.com/docs/environment-variables), [staged production promotion](https://vercel.com/docs/deployments/promoting-a-deployment), and [rollback](https://vercel.com/docs/deployments/promote-preview-to-production) should be rechecked when project settings are created.
