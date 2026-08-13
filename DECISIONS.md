# Decision Log

## Bank holidays and entitlement

- **Decision required:** Are bank holidays included in annual entitlement or provided separately?
- **Current assumption:** Configurable per organisation; no calculation assumption is made in Phase 1.
- **Why:** The specification explicitly prohibits inventing this policy.
- **Confirmation needed:** Kingsley Hall HR policy, including part-time treatment.
- **Impact if changed:** Leave calculation configuration and display wording only.

## Leave year start

- **Decision required:** What is the official leave-year start date?
- **Current assumption:** 1 April, stored as configurable `04-01`.
- **Confirmation needed:** HR confirmation and first seeded year.
- **Impact if changed:** Seed/configuration change; no schema change.

## Employee calendar privacy

- **Decision required:** May employees see colleague names or only “Unavailable”?
- **Current assumption:** “Unavailable”; managers see names within authorised teams.
- **Impact if changed:** Organisation privacy setting and calendar projection.

## Entitlement overbooking

- **Decision required:** Who can override insufficient entitlement, and must a reason be recorded?
- **Current assumption:** HR_ADMIN and SUPER_ADMIN only, with a mandatory reason and audit entry.
- **Impact if changed:** Approval policy only.

## Cancellation policy

- **Decision required:** Can employees directly cancel future approved leave, or request cancellation approval?
- **Current assumption:** Pending requests can be cancelled directly; approved requests require manager/HR cancellation approval.
- **Impact if changed:** Workflow states and notifications.

## Half days

- **Decision required:** Is half-day booking required for Release 1?
- **Current assumption:** Defer UI; schema/service design will permit AM/PM without assuming four hours.
- **Impact if changed:** Phase 3 working-pattern segments and Phase 4 form.
