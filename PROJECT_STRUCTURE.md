# Project Folder Structure

```text
src/app/                  Routes, layouts, route handlers
src/components/           Shared accessible UI
src/features/auth/        Authentication and permission policies
src/features/employees/   Staff application/domain code (Phase 2)
src/features/leave/       Leave engine and workflows (Phase 3+)
src/features/calendar/    Calendar policy and UI (Phase 6)
src/features/admin/       Administration use cases (Phase 8)
src/features/reports/     Queries and export adapters (Phase 9)
src/lib/                  Infrastructure helpers
prisma/                   Schema, migrations and seed
tests/                    Unit and integration tests
emails/                   Provider-neutral templates (Phase 7)
```

Route code stays thin. Feature modules own validation, policies, services and repositories; shared infrastructure is restricted to `src/lib`.
