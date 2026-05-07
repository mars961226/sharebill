export const CURRENCY = "EUR";

export function formatEuro(cents: number): string {
  const amount = cents / 100;

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: CURRENCY,
  }).format(amount);
}

export function parseEuroToCents(input: FormDataEntryValue | null): number {
  if (typeof input !== "string") {
    throw new Error("Amount is required.");
  }

  const normalized = input.trim().replace(",", ".");

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Amount must use up to two decimal places.");
  }

  const [euros, cents = ""] = normalized.split(".");
  return Number(euros) * 100 + Number(cents.padEnd(2, "0"));
}

export function euroInputValue(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function equalSplit(
  amountCents: number,
  participantCount: number,
): {
  perParticipantCents: number;
  splitTotalCents: number;
  roundingDifferenceCents: number;
} {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error("Amount must be a positive integer number of cents.");
  }

  if (!Number.isInteger(participantCount) || participantCount <= 0) {
    throw new Error("Participant count must be a positive integer.");
  }

  const perParticipantCents = Math.ceil(amountCents / participantCount);
  const splitTotalCents = perParticipantCents * participantCount;

  return {
    perParticipantCents,
    splitTotalCents,
    roundingDifferenceCents: splitTotalCents - amountCents,
  };
}

export function assertCustomSplitTotal(
  amountCents: number,
  owedAmountsCents: number[],
): void {
  const total = owedAmountsCents.reduce((sum, value) => sum + value, 0);

  if (total !== amountCents) {
    throw new Error("Custom split total must equal the expense amount.");
  }
}
