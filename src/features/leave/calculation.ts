export type DayHours = { monday: number; tuesday: number; wednesday: number; thursday: number; friday: number; saturday: number; sunday: number };
export type Period = "FULL_DAY" | "AM" | "PM";
export type DateRange = { startDate: string; endDate: string };

const weekday: (keyof DayHours)[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export type RequestCalculation = {
  hours: number;
  workingDays: number;
  excludedBankHolidays: string[];
};

function parseDateOnly(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("INVALID_DATE");
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) throw new Error("INVALID_DATE");
  return date;
}

function iso(date: Date) { return date.toISOString().slice(0, 10); }

export function calculateRequestedHours(input: {
  startDate: string; endDate: string; pattern: DayHours; startPeriod?: Period; endPeriod?: Period;
  bankHolidays?: ReadonlySet<string>; excludeBankHolidays?: boolean;
}): RequestCalculation {
  const start = parseDateOnly(input.startDate); const end = parseDateOnly(input.endDate);
  if (start > end) throw new Error("START_AFTER_END");
  let hours = 0; let workingDays = 0; const excludedBankHolidays: string[] = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const date = iso(cursor);
    const scheduled = input.pattern[weekday[cursor.getUTCDay()]];
    if (!Number.isFinite(scheduled) || scheduled < 0 || scheduled > 24) throw new Error("INVALID_WORKING_PATTERN");
    if (scheduled === 0) continue;
    if (input.excludeBankHolidays && input.bankHolidays?.has(date)) { excludedBankHolidays.push(date); continue; }
    let dayHours = scheduled;
    if (date === input.startDate && input.startPeriod && input.startPeriod !== "FULL_DAY") dayHours /= 2;
    if (date === input.endDate && input.endPeriod && input.endPeriod !== "FULL_DAY" && input.startDate !== input.endDate) dayHours /= 2;
    hours += dayHours; workingDays += dayHours / scheduled;
  }
  return { hours: Math.round(hours * 100) / 100, workingDays: Math.round(workingDays * 100) / 100, excludedBankHolidays };
}

export function calculateEntitlement(input: { base: number; carriedForward?: number; adjustment?: number }) {
  const total = input.base + (input.carriedForward ?? 0) + (input.adjustment ?? 0);
  if (![input.base, input.carriedForward ?? 0, input.adjustment ?? 0].every(Number.isFinite)) throw new Error("INVALID_ENTITLEMENT");
  return Math.round(total * 100) / 100;
}

export function calculateBalance(input: { base: number; carriedForward?: number; adjustment?: number; approved: number; pending?: number }) {
  const entitlement = calculateEntitlement(input);
  return { entitlement, approved: input.approved, pending: input.pending ?? 0, remaining: entitlement - input.approved, potentialRemaining: entitlement - input.approved - (input.pending ?? 0) };
}

export function rangesOverlap(a: DateRange, b: DateRange) {
  return parseDateOnly(a.startDate) <= parseDateOnly(b.endDate) && parseDateOnly(b.startDate) <= parseDateOnly(a.endDate);
}

export type ValidationIssue = "START_AFTER_END" | "NO_WORKING_HOURS" | "OVERLAPPING_REQUEST" | "INSUFFICIENT_ENTITLEMENT";
export function validateLeaveRequest(input: { requestedHours: number; availableHours: number; range: DateRange; existing: DateRange[]; allowOverdraw?: boolean }): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (parseDateOnly(input.range.startDate) > parseDateOnly(input.range.endDate)) issues.push("START_AFTER_END");
  if (input.requestedHours <= 0) issues.push("NO_WORKING_HOURS");
  if (input.existing.some((range) => rangesOverlap(input.range, range))) issues.push("OVERLAPPING_REQUEST");
  if (!input.allowOverdraw && input.requestedHours > input.availableHours) issues.push("INSUFFICIENT_ENTITLEMENT");
  return issues;
}
