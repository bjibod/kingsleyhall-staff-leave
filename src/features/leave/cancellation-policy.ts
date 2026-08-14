export function canCancelRequest(input: { actorEmployeeId: string; requestEmployeeId: string; status: string; startDate: Date; now?: Date }) {
  const now = input.now ?? new Date();
  return input.actorEmployeeId === input.requestEmployeeId
    && (input.status === "PENDING" || input.status === "APPROVED")
    && input.startDate > now;
}

export function cancellationOutcome(status: "PENDING" | "APPROVED") {
  return status === "APPROVED" ? "REQUEST_REVIEW" as const : "CANCEL_IMMEDIATELY" as const;
}
