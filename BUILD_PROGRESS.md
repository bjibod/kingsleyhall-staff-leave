# Build Progress

| Phase | Feature | Status | Tests completed | Known issues | Next action |
|---|---|---|---|---|---|
| 1 | Project, TypeScript, environment | COMPLETE | ESLint and Next.js production build passed | None | Begin Phase 2 |
| 1 | PostgreSQL + Prisma foundation | COMPLETE | Prisma schema validation and client generation passed | Migration/seed require an attached PostgreSQL instance | Apply migration in local deployment |
| 1 | Authentication and sessions | COMPLETE | Session-token unit test passed | Password reset delivery deferred to Phase 7 | Expand integration coverage in Phase 2 |
| 1 | Roles and protected dashboard | COMPLETE | 5 RBAC assertions passed; protected routes compile | Resource-scope policies expand with Phase 2 | Implement reporting hierarchy scope |
| 2 | Organisation and staff model/read UI | COMPLETE | Prisma validation and production compile | Create/edit mutation forms remain | Complete admin mutations |
| 3 | Leave engine | COMPLETE | 11 calculation tests passed | Bank-holiday policy needs confirmation | Confirm policy |
| 4 | Employee request workflow | COMPLETE | Calculation/validation tests; production compile | Live DB integration test pending | Run with PostgreSQL |
| 5 | Manager approval | COMPLETE | 4 approval-scope tests passed | Live transaction test pending | Run with PostgreSQL |
| 6 | Privacy-aware calendar | COMPLETE | Production compile | Monthly grid/filter UI can be enhanced | Browser QA |
| 7 | Notifications | IN PROGRESS | In-app workflow compiles | Email retry delivery not wired | Add queue/provider integration |
| 8 | Administration | IN PROGRESS | Read surfaces compile | Mutation forms incomplete | Implement mutations |
| 9 | Reports and CSV | COMPLETE | Protected route compiles | Filter UI incomplete | Add filters |
| 10 | Audit and security | TESTING | RBAC, approval scope, lint and build pass | Rate limiting/error monitoring pending | Security integration tests |
| 11 | QA | IN PROGRESS | 21 tests pass | E2E/mobile/accessibility/live DB pending | Attach PostgreSQL and run E2E |
| 12 | Production readiness | IN PROGRESS | Production build passes; migration/seed/Docker/docs present | Clean deployment test pending | Deploy staging |
