# Release 1 Risks

| Risk | Mitigation |
|---|---|
| Incorrect hours for variable/part-time patterns | Effective-dated patterns, date-by-date calculation, boundary-heavy unit tests |
| Concurrent submissions overbook entitlement | Transactional validation and database overlap checks |
| Cross-team or future cross-tenant data exposure | Central policies, organisation predicates, direct-API denial tests |
| Date/DST errors | Date-only domain values and explicit Europe/London policy |
| Unconfirmed bank-holiday treatment | Configurable policy and decision log; never hard-code |
| Email failure loses workflow signal | Persist in-app notification first, retry email asynchronously |
| Historical records mutated or removed | Soft disable and append-only audit records |
| Seed credentials reused | Demo-only accounts, forced production secret/configuration checks |
