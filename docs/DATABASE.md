# Production Database

## Platform

The application uses PostgreSQL through Prisma. Development, staging, and production require separate databases and credentials. No browser connects directly to PostgreSQL; all access passes through authenticated server code.

## Core records

- `Organisation`, `Location`, and `Department` define tenant scope.
- `User`, `Role`, `UserRole`, and `Session` implement identity and access.
- `Employee` and `WorkingPattern` hold employment and effective-dated work hours.
- `LeaveYear`, `LeaveType`, `LeaveEntitlement`, `LeaveRequest`, and `BankHoliday` implement leave rules.
- `Notification` delivers in-application messages.
- `AuditLog` records security- and HR-relevant mutations and is append-only at database level.

## Integrity model

Foreign keys and organisation-aware unique keys protect relationships and tenant-local identifiers. Check constraints reject invalid employment/leave dates, invalid work hours, non-positive requests, and negative effective entitlement. A partial unique index permits one active leave year per organisation.

Leave request submission and decisions use serializable transactions with bounded retry. Balance, overlap, routing, and status checks must execute inside the same transaction as the write. This prevents two concurrent approvals or submissions from both relying on stale availability.

## Operational requirements

- Use a managed PostgreSQL service with TLS, encryption at rest, automated backups, and point-in-time recovery where available.
- Give the runtime only the privileges it needs; use a separate migration identity where supported.
- Do not expose `DATABASE_URL` to browser code or logs.
- Monitor connection saturation, slow queries, failed transactions, storage, replication/backup health, and migration failures.
- Approve retention, audit access, and deletion/anonymisation rules with Kingsley Hall management/DPO before production.

Supabase is optional managed PostgreSQL infrastructure. Row Level Security is required only if browser-accessible Supabase APIs are introduced; it does not replace server-side authorisation.
