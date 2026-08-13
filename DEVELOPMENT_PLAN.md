# Development Phases

1. **Foundation:** project, PostgreSQL/Prisma, authentication, roles, protected layout and environment configuration.
2. **Organisation and staff:** locations, departments, employees, manager assignments and effective working patterns.
3. **Leave engine:** leave years/types, hourly entitlement, bank-holiday policy and comprehensive calculation tests.
4. **Employee requests:** balance dashboard, request form, overlap/balance validation and request history.
5. **Manager approval:** scoped queue, single-screen review, approve/reject and workflow tests.
6. **Calendar:** privacy-aware monthly team calendar and filters.
7. **Notifications:** durable in-app records and provider-neutral transactional email.
8. **Administration:** employee, entitlement, organisation and bank-holiday management.
9. **Reporting:** balance/request reports, filters and CSV export.
10. **Audit and security:** append-only audit coverage, hardening, rate limits and direct-API permission tests.
11. **QA:** unit, integration, E2E, mobile, accessibility and edge-case verification.
12. **Production readiness:** clean install, deployment, operations documentation and Release 1 report.

Each phase uses the gate: implement → migrate → test → fix → verify → update `BUILD_PROGRESS.md`. Later phases do not begin while the current gate fails.
