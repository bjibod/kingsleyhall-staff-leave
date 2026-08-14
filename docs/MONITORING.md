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

## Staging verification record

Monitoring delivery was verified on 15 August 2026 using a temporary staging-only, bearer-protected route that captured a fixed synthetic error and no employee data.

- Environment: `staging`
- Verified release: `47591bc071f2041c2a8104f7271d04f972c92a32`
- Endpoint result: `202 {"status":"captured"}`
- Sentry issue: `JAVASCRIPT-NEXTJS-2`
- Event: `Controlled staging Sentry verification`

The event was inspected to confirm the expected environment and release. The temporary route, authorization helper, test secret example and Vercel secret were scheduled for removal immediately after verification. No intentional error route may be promoted to production.

## Incident workflow

Triage severity and affected environment, confirm the release, inspect sanitized stack traces and correlated health status, and decide whether to mitigate or roll back. Never copy sensitive production records into Sentry while investigating. Each confirmed defect should receive a regression test where practical.

The implementation follows Sentry's current [Next.js SDK](https://docs.sentry.io/platforms/javascript/guides/nextjs/) and [event filtering](https://docs.sentry.io/platforms/javascript/configuration/filtering/) guidance.
