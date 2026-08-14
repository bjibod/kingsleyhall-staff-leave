# Security Policy

## Supported version

Only the current `main` branch is supported before the first production release.

## Reporting a vulnerability

Do not publish authentication, authorisation, employee-data, or infrastructure vulnerabilities in a public issue. Use GitHub's private vulnerability reporting feature when enabled. If it is unavailable, contact the repository owner through an agreed private Kingsley Hall channel.

Include the affected route/component, reproduction steps using fictional data, impact, and any suggested mitigation. Do not access real staff records or perform destructive testing.

## Secrets and personal data

Never commit credentials, tokens, environment files, database exports, or real employee information. Any exposed credential must be revoked and rotated; deleting it from the latest commit is insufficient.
