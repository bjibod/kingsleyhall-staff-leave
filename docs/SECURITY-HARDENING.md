# Authentication and security hardening

## Controls delivered

- Login responses do not disclose whether a staff account exists.
- Failed sign-ins are throttled by an HMAC-derived email-and-client key: five failures in a 15-minute window cause a 15-minute block. Raw email and IP values are not stored in the throttle table.
- Reset tokens use 256 bits of randomness, are stored only as SHA-256 hashes, expire after 30 minutes, and can be claimed once.
- A successful password reset revokes every existing session for that user.
- Session cookies are HTTP-only, SameSite Lax, Secure in production, and high priority.
- Global browser headers apply CSP, clickjacking protection, MIME sniffing protection, referrer restrictions, permissions restrictions, and COOP. Production HTTPS responses also apply one-year HSTS.

## Deployment requirements

1. Apply migrations with `pnpm db:migrate:deploy` before starting the new application release.
2. Set `AUTH_SECRET` to a randomly generated value of at least 32 characters and rotate it through the secret manager, not source control.
3. Set `APP_URL` to the canonical HTTPS origin. Reset links are generated from this value.
4. Configure `EMAIL_PROVIDER=http`, `EMAIL_API_URL`, `EMAIL_API_KEY`, and `EMAIL_FROM`. Console email is rejected in production.
5. Configure the edge proxy to replace, rather than append untrusted values to, `X-Forwarded-For`. Login throttling uses its first address.
6. Confirm the CSP in the deployed browser before launch. Add external origins only when a required production integration is identified.

## Operational checks

- Alert on repeated `password_reset_delivery_failed` events; these logs intentionally contain no address or token.
- Periodically delete expired reset tokens, expired sessions, and throttle records whose blocks have elapsed.
- Test that changing a password signs out all devices.
- Never place reset URLs, passwords, session cookies, `AUTH_SECRET`, or provider keys in logs or support tickets.
