# Production monitoring

Sentry monitors unhandled server and client exceptions, failed Next.js requests, email-delivery failures, database health failures, route performance and release regressions. Monitoring is diagnostic, not a repository for employee information.

## Configuration

1. Create a Sentry organisation and a Next.js project. Limit project membership to authorised technical responders and require multi-factor authentication.
2. Use separate `development`, `staging` and `production` Sentry environments. A single project may be used with strict environment filters, although separate staging and production projects provide stronger access and quota isolation.
3. Add `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `NEXT_PUBLIC_SENTRY_ENVIRONMENT` and `SENTRY_TRACES_SAMPLE_RATE` to each hosting environment. Recommended initial trace rates are `0` for local development, `0.2` for staging and `0.1` for production.
4. Add build-only `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` and `SENTRY_PROJECT` secrets in Vercel Production and Preview settings so source maps can be uploaded. Give the token only the minimum release/source-map scope and rotate it according to the credential policy.
5. Release identification uses `SENTRY_RELEASE`, `RELEASE_SHA` or Vercel's `VERCEL_GIT_COMMIT_SHA`, in that order. The client value may be supplied as `NEXT_PUBLIC_SENTRY_RELEASE` when the host cannot expose the release automatically.
6. Never put a Sentry auth token in a `NEXT_PUBLIC_` variable, `.env` example value, log or support ticket.

The SDK is disabled when no DSN is configured, so local development and automated tests do not send telemetry unexpectedly.

## Privacy controls

- `sendDefaultPii` is disabled in browser, server and edge runtimes.
- Request bodies, cookies and all request headers are removed before transmission.
- Query strings and fragments are removed from URLs, protecting reset and invitation tokens.
- User objects and arbitrary extra data are removed.
- Breadcrumb data is removed; breadcrumb category and message may remain for sequence diagnosis.
- Only standard runtime, trace, operating-system, browser, device, application and cloud-resource contexts are retained.
- Session Replay is not enabled.

Do not add employee names, email addresses, telephone numbers, leave reasons, manager comments, request bodies, database URLs, passwords, session identifiers or tokens as Sentry context. Review a sample of new event types before raising sampling or retention.

## Alerts and ownership

Create environment-scoped alerts for:

| Condition | Initial action |
| --- | --- |
| New production error or regression | Notify technical owner immediately during working hours |
| `/api/health` database failure | Page the operational contact after two consecutive failures |
| Password-reset or invitation delivery failures | Notify technical owner when two occur in 15 minutes |
| Error rate above 2% for five minutes | Treat as a potential incident |
| p95 server transaction above two seconds for 15 minutes | Investigate performance and database latency |

Assign every alert to a named role, not an individual-only account. Link alerts to the incident and rollback procedures. Resolve an issue only after the fix is deployed and verified.

## Staging verification

1. Deploy this branch to staging with the staging DSN and release SHA configured.
2. Set a unique staging-only `MONITORING_TEST_SECRET` of at least 32 characters in the hosting secret store. Never configure this variable in production.
3. Send an authenticated `POST` to `/api/monitoring-test` using `Authorization: Bearer <MONITORING_TEST_SECRET>`. The endpoint returns `404` outside staging or when authentication fails, captures only a fixed synthetic error, and returns `202` after Sentry accepts the event.
4. Confirm Sentry records the exception under environment `staging` and the expected release.
5. Inspect the event and confirm there is no request body, cookie, authorization header, user record, email, reset/invitation token or query string.
6. Confirm a transaction trace appears at the configured sampling rate and source maps resolve application frames.
7. Remove the intentional error mechanism in the same branch, run CI, and redeploy. No intentional test-error route may be merged to `main` or promoted to production.

## Incident workflow

Triage severity and affected environment, confirm the release, inspect sanitized stack traces and correlated health status, and decide whether to mitigate or roll back. Never copy sensitive production records into Sentry while investigating. Each confirmed defect should receive a regression test where practical.

The implementation follows Sentry's current [Next.js SDK](https://docs.sentry.io/platforms/javascript/guides/nextjs/) and [event filtering](https://docs.sentry.io/platforms/javascript/configuration/filtering/) guidance.
