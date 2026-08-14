-- Structural integrity checks. Apply only after the preflight queries in
-- docs/DATABASE-MIGRATION.md return no rows.
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_employment_dates_check"
  CHECK ("endDate" IS NULL OR "endDate" >= "startDate");

ALTER TABLE "WorkingPattern" ADD CONSTRAINT "WorkingPattern_effective_dates_check"
  CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom");
ALTER TABLE "WorkingPattern" ADD CONSTRAINT "WorkingPattern_hours_check"
  CHECK (
    "mondayHours" BETWEEN 0 AND 24 AND "tuesdayHours" BETWEEN 0 AND 24 AND
    "wednesdayHours" BETWEEN 0 AND 24 AND "thursdayHours" BETWEEN 0 AND 24 AND
    "fridayHours" BETWEEN 0 AND 24 AND "saturdayHours" BETWEEN 0 AND 24 AND
    "sundayHours" BETWEEN 0 AND 24
  );

ALTER TABLE "LeaveYear" ADD CONSTRAINT "LeaveYear_dates_check"
  CHECK ("endDate" >= "startDate");
ALTER TABLE "LeaveEntitlement" ADD CONSTRAINT "LeaveEntitlement_hours_check"
  CHECK (
    "entitlementHours" >= 0 AND "carriedForwardHours" >= 0 AND
    ("entitlementHours" + "carriedForwardHours" + "manualAdjustmentHours") >= 0
  );
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_dates_check"
  CHECK ("endDate" >= "startDate");
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_hours_check"
  CHECK ("requestedHours" > 0);

-- An organisation may have only one active leave year.
CREATE UNIQUE INDEX "LeaveYear_one_active_per_organisation"
  ON "LeaveYear" ("organisationId") WHERE "status" = 'ACTIVE';

CREATE INDEX "LeaveYear_organisationId_status_idx" ON "LeaveYear"("organisationId", "status");
CREATE INDEX "LeaveType_organisationId_active_idx" ON "LeaveType"("organisationId", "active");
CREATE INDEX "LeaveRequest_status_startDate_endDate_idx" ON "LeaveRequest"("status", "startDate", "endDate");
CREATE INDEX "LeaveRequest_reviewedBy_reviewedAt_idx" ON "LeaveRequest"("reviewedBy", "reviewedAt");

ALTER TABLE "BankHoliday" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "BankHoliday" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX "BankHoliday_organisationId_active_date_idx" ON "BankHoliday"("organisationId", "active", "date");

-- Application credentials cannot mutate or erase audit history accidentally.
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog records are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "AuditLog_append_only"
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
