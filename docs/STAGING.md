# Staging environment

Staging is the mandatory promotion target between CI and production. It runs the same immutable container and PostgreSQL migrations as production, but uses separate infrastructure, credentials, email configuration and fictional data.

## Architecture

```text
Local development → GitHub branch → Pull request → CI → main
                                                       ↓
                                          approved staging workflow
                                                       ↓
                           isolated PostgreSQL ← staging container → staging email
                                                       ↓
                                            health monitor and UAT
                                                       ↓
                                             production approval
```

The workflow publishes `ghcr.io/bjibod/kingsleyhall-staff-leave:<commit-sha>` and the moving `:staging` tag. Production must later use the tested immutable SHA tag, never rebuild source independently.

## One-time infrastructure setup

1. Create a managed PostgreSQL 15-or-newer database named for staging. Give its application user access only to that staging database, enable encrypted connections, automated daily backups and point-in-time recovery where available. Do not restore production staff data into it.
2. Create a staging HTTPS web service from this repository's `Dockerfile`. Configure it to pull `ghcr.io/bjibod/kingsleyhall-staff-leave:staging`, listen on port `3000`, restart on failure, and expose `/api/health` to the platform health checker.
3. Assign a staging-only hostname such as `leave-staging.khccc.com`, enable a valid TLS certificate, and restrict access to Kingsley Hall testers using the hosting platform's access control where possible.
4. Create a staging/sandbox account with the transactional email provider. Restrict recipients to approved tester addresses if supported; never use the production API key or sender identity.
5. In GitHub, open **Settings → Environments → New environment**, name it `staging`, add the designated deployment reviewer, prevent self-review where available, and restrict deployment branches to `main`.
6. In that GitHub `staging` environment, add secret `STAGING_DATABASE_URL`, secret `STAGING_DEPLOY_HOOK`, and variable `STAGING_HEALTH_URL` with value `https://<staging-host>/api/health`. The deploy hook must be held as a secret because it authorizes releases.
7. In the hosting platform's encrypted environment settings, create every variable in `.env.staging.example`. Generate a unique `AUTH_SECRET`; do not copy development or production secrets. Set `RELEASE_SHA` from the deployed image tag.
8. Configure an external uptime check for `/api/health` every five minutes. Alert the technical owner after two consecutive failures. Application/error logs must be centralized with secrets and personal data redacted.

## Exact deployment procedure

1. Merge a pull request only after the `CI` workflow passes.
2. Copy the full 40-character commit SHA from `main`.
3. Open **GitHub → Actions → Deploy staging → Run workflow**.
4. Paste the SHA into `release_sha` and run the workflow.
5. The protected `staging` environment pauses for its reviewer. Confirm the commit and approve it.
6. The workflow verifies that the SHA belongs to `main`, applies migrations to the isolated staging database, builds and publishes the immutable image, invokes the host deploy hook, and waits for healthy staging status.
7. Open `/api/health` and confirm `status` is `ok`, `environment` is `staging`, and `release` matches the requested SHA.
8. Open the application and confirm the purple **STAGING — fictional test data only** banner appears on login and authenticated pages.
9. Execute every browser journey in `docs/TESTING.md`. Record commit, tester, browser, time and outcome in the release ticket.
10. Obtain UAT acceptance from HR, a manager and an employee representative. A failed check blocks production promotion.

## Staging data

Create only realistic fictional records, using obvious names such as `UAT Employee One` and addresses controlled by testers. Configure at least one employee, manager, HR administrator, leave year, working pattern, leave type, bank holiday and entitlement. Never upload an employee spreadsheet or production database backup.

## Environment boundaries

| Setting | Development | Preview | Staging | Production |
| --- | --- | --- | --- | --- |
| Database | Local | Disposable | Isolated managed staging | Isolated managed production |
| Auth secret | Developer-only | Ephemeral | Staging-only secret | Production-only secret |
| Email | Console | Disabled/sandbox | Sandbox/restricted | Approved live provider |
| URL | Localhost | Temporary HTTPS | Stable staging HTTPS | Canonical live HTTPS |
| Data | Fictional fixtures | Fictional | Fictional UAT | Real authorised staff data |

## Rollback

Repoint the staging service to the last healthy immutable SHA and redeploy. Database migrations must be backward compatible; do not automatically reverse a migration containing user data. If schema rollback is required, stop staging, restore its staging-only backup to a new database, repoint `DATABASE_URL`, and verify health before resuming UAT.
