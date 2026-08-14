# Transactional email

## Delivery architecture

The application uses a provider-neutral HTTPS adapter rather than coupling business logic to a vendor SDK. It supports any approved provider or internal gateway accepting bearer-authenticated JSON with `from`, `to`, `subject`, `text`, `replyTo` and `tag` fields. The provider/gateway contract should map the optional `idempotency-key` header to its duplicate-suppression feature.

Console delivery is metadata-only and permitted solely in local development/test. It never prints recipients, message bodies or secure links. Staging rejects console delivery, requires HTTPS and restricts all recipients to `EMAIL_ALLOWED_RECIPIENTS`. Production requires HTTPS but deliberately does not use a test allowlist.

## Required journeys

| Event | Recipient | Content boundary |
| --- | --- | --- |
| Account invitation | Invited staff member | Single-use 72-hour activation URL |
| Password reset | Active account address | Single-use 30-minute reset URL |
| Leave submitted | Employee | Dates, hours and pending status |
| Approval required | Assigned manager/HR approver | Employee name, dates and hours |
| Leave approved/rejected | Employee | Dates, hours and decision; no manager comment |
| Pending leave cancelled | Employee | Dates, hours and confirmation |
| Approved leave cancellation requested | Employee and manager | Dates, hours and review status |

Passwords, session identifiers, cookies, employee notes, leave reasons and manager comments are never included. Invitation/reset URLs are necessary secrets, expire, work once and are sent only to the account address.

## Environment configuration

- `EMAIL_PROVIDER`: `console` locally or `http` for staging/production.
- `EMAIL_API_URL`: HTTPS provider/gateway endpoint.
- `EMAIL_API_KEY`: secret bearer credential.
- `EMAIL_FROM`: verified sender identity.
- `EMAIL_REPLY_TO`: monitored People/HR mailbox.
- `EMAIL_ALLOWED_RECIPIENTS`: comma-separated tester addresses, mandatory for HTTP delivery outside production and intentionally blank in production.

Store credentials in the hosting platform's encrypted environment settings. Use independent sandbox and production API keys, verified senders and suppression lists. Configure SPF, DKIM and DMARC for the sending domain before UAT. Never commit credentials.

## Failure and retry behavior

Each send has a 10-second timeout and up to three attempts. Only network failures, HTTP 429 and 5xx responses are retried with short bounded backoff. Permanent 4xx rejections fail immediately. Event-specific idempotency keys prevent duplicate messages where the provider supports them.

Leave database transactions commit independently of external email. A delivery outage is captured by Sentry and does not roll back an approved leave decision or encourage the user to submit twice. The in-app notification remains authoritative. Invitation and reset request screens also avoid account disclosure when delivery fails.

Do not create an unbounded retry loop inside a web request. If sustained provider failures occur, resolve the provider incident and use the invitation resend control where applicable. A durable transactional outbox should be introduced before adding high-volume/background delivery.

## Production verification

1. Verify sender domain authentication and reply-to mailbox ownership.
2. In staging, configure only approved tester recipients and send every journey using fictional records.
3. Confirm links use the staging HTTPS origin, expire as documented and cannot be reused.
4. Confirm rejected/non-allowlisted recipients fail safely and generate a sanitized monitoring event.
5. Review delivered messages for passwords, notes, comments, cookies, session data and unnecessary personal data.
6. Check provider delivery, bounce and complaint dashboards; route alerts to the technical owner.
7. Repeat a controlled delivery test after production configuration, before staff onboarding begins.
