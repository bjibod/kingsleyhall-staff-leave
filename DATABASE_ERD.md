# Database ERD

The full target Release 1 model is shown here; Phase 1 implements the shaded foundation subset (`Organisation`, `Employee`, `User`, `Role`, `UserRole`, `Session`). Remaining entities arrive in their scheduled phases.

```mermaid
erDiagram
  ORGANISATION ||--o{ LOCATION : has
  ORGANISATION ||--o{ DEPARTMENT : has
  ORGANISATION ||--o{ EMPLOYEE : employs
  ORGANISATION ||--o{ LEAVE_YEAR : defines
  ORGANISATION ||--o{ LEAVE_TYPE : defines
  ORGANISATION ||--o{ BANK_HOLIDAY : configures
  ORGANISATION ||--o{ AUDIT_LOG : records
  EMPLOYEE ||--o| USER : authenticates_as
  EMPLOYEE ||--o{ EMPLOYEE : manages
  EMPLOYEE ||--o{ WORKING_PATTERN : follows
  EMPLOYEE ||--o{ LEAVE_ENTITLEMENT : receives
  EMPLOYEE ||--o{ LEAVE_REQUEST : submits
  LOCATION ||--o{ EMPLOYEE : locates
  DEPARTMENT ||--o{ EMPLOYEE : groups
  USER ||--o{ USER_ROLE : holds
  ROLE ||--o{ USER_ROLE : grants
  USER ||--o{ SESSION : owns
  USER ||--o{ NOTIFICATION : receives
  LEAVE_YEAR ||--o{ LEAVE_ENTITLEMENT : contains
  LEAVE_TYPE ||--o{ LEAVE_REQUEST : classifies
```

All tenant-owned records carry `organisationId` directly or are reached through an immutable tenant-owned parent. History-bearing records use status/active flags rather than hard deletion. Monetary values are absent; leave hours use fixed-precision database decimals in the later leave migration.
