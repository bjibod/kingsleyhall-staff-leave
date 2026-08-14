# Staff onboarding

HR administrators and super administrators create staff records under **Administration → Employees → Add employee**. Creation is restricted to the administrator's organisation and assigns the minimum `EMPLOYEE` role.

The system creates an `INVITED` account with an unusable random password, sends a 256-bit single-use activation token, and records only its SHA-256 hash. The invitation expires after 72 hours. Activation sets the staff member's password and changes the account to `ACTIVE`. Administrators cannot view or send passwords.

If delivery fails or a link expires, open the employee record and select **Resend invitation**. Resending invalidates all earlier unused invitations. Production requires the transactional email settings documented in `docs/SECURITY-HARDENING.md`.

Before onboarding staff, configure their leave entitlement and working pattern. Account creation intentionally does not guess contractual hours or annual entitlement.
