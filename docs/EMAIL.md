# Transactional email

## Delivery architecture

The application supports three provider modes:

- `console`: metadata-only local development output. It is rejected in staging and production.
- `http`: the existing provider-neutral bearer-authenticated HTTPS adapter.
- `microsoft-graph`: Microsoft 365 app-only delivery through Microsoft Graph.

Microsoft 365 delivery uses the OAuth 2.0 client-credentials flow. The server obtains a short-lived token for `https://graph.microsoft.com/.default` and sends through `POST /v1.0/users/{sender}/sendMail`. Credentials remain server-side in Vercel; no employee signs in and no mailbox password is stored.

Staging requires `EMAIL_ALLOWED_RECIPIENTS`. Production deliberately has no test allowlist.

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

Passwords, session identifiers, cookies, employee notes, leave reasons and manager comments are never included. Invitation and reset URLs expire, work once and are sent only to the account address.

## Microsoft 365 administrator setup

An authorised Microsoft 365 and Exchange administrator must complete this work. The earlier `AADSTS50079` sign-in error means the administrator account must finish Microsoft MFA enrollment before setup can continue.

1. Create a single-tenant Entra app registration named `Kingsley Hall Staff Leave Email`.
2. Record the Directory (tenant) ID and Application (client) ID.
3. Under Microsoft Graph API permissions, add the **Application** permission `Mail.Send`.
4. Grant tenant-wide administrator consent.
5. Create a time-limited client secret for initial staging. Record its value immediately and set an owner and rotation date. Prefer a certificate or workload identity in a later hardening change.
6. Create or nominate a dedicated sender mailbox under `@khccc.com`; do not use a personal administrator mailbox.
7. In Exchange Online, use **Role Based Access Control for Applications** to limit the app to only the dedicated sender mailbox. Do not leave the app able to send as every user.
8. Verify the mailbox restriction before adding credentials to Vercel.

Microsoft documents `Mail.Send` application permission as administrator-consented and capable of sending as any user unless Exchange access is restricted. Application RBAC is therefore a release requirement.

## Environment configuration

For Microsoft 365:

- `EMAIL_PROVIDER=microsoft-graph`
- `MICROSOFT_TENANT_ID`: Entra Directory (tenant) ID.
- `MICROSOFT_CLIENT_ID`: app registration Application (client) ID.
- `MICROSOFT_CLIENT_SECRET`: current secret value; never the secret ID.
- `MICROSOFT_SENDER_EMAIL`: dedicated authorised sender mailbox.
- `EMAIL_REPLY_TO`: monitored People/HR mailbox.
- `EMAIL_ALLOWED_RECIPIENTS`: comma-separated authorised staging testers; blank only in production.

The legacy HTTP adapter additionally uses `EMAIL_API_URL`, `EMAIL_API_KEY` and `EMAIL_FROM`.

Store credentials in Vercel encrypted environment settings. Use independent staging and production app credentials. Never commit credentials. Configure SPF, DKIM and DMARC for `khccc.com` before UAT.

## Failure and retry behaviour

Each request has a 10-second timeout and up to three attempts. HTTP 429, 5xx and network failures are retried with bounded backoff. Permanent 4xx rejections fail immediately. Microsoft access tokens are cached in memory until shortly before expiry.

Leave transactions commit independently of external email. Delivery failures are captured by Sentry and do not roll back leave decisions. In-app notifications remain authoritative. Do not create an unbounded retry loop inside a web request.

## Staging verification

1. Add the Microsoft values to Vercel Preview and Production scopes used by the staging project.
2. Set `EMAIL_ALLOWED_RECIPIENTS` to one or more authorised fictional-test recipients.
3. Redeploy staging.
4. Test invitation, password reset, submission, approval, rejection and cancellation journeys with fictional records.
5. Confirm every link uses the staging HTTPS origin and single-use links expire correctly.
6. Confirm a non-allowlisted address fails safely and creates a sanitised Sentry event.
7. Confirm the message appears in the dedicated sender mailbox's Sent Items and the recipient's inbox.
8. Review headers and Microsoft delivery reports; verify SPF, DKIM and DMARC alignment.
9. Confirm no passwords, comments, leave reasons, cookies, tokens other than the necessary one-time link, or unnecessary staff data are included.
10. Rotate the staging secret after the controlled test if it was exposed to anyone during setup.

Do not enable unrestricted production delivery until the staging evidence and mailbox-scoping evidence have been approved.
