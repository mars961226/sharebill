import { describe, expect, it } from "vitest";
import {
  assertCustomSplitTotal,
  equalSplit,
  euroInputValue,
  parseEuroToCents,
} from "@/lib/money";

describe("equalSplit", () => {
  it("rounds up split amounts to cents", () => {
    expect(equalSplit(1000, 3)).toEqual({
      perParticipantCents: 334,
      splitTotalCents: 1002,
      roundingDifferenceCents: 2,
    });
  });

  it("keeps exact splits exact", () => {
    expect(equalSplit(1200, 3)).toEqual({
      perParticipantCents: 400,
      splitTotalCents: 1200,
      roundingDifferenceCents: 0,
    });
  });
});

describe("assertCustomSplitTotal", () => {
  it("accepts exact totals", () => {
    expect(() => assertCustomSplitTotal(1000, [250, 750])).not.toThrow();
  });

  it("rejects mismatched totals", () => {
    expect(() => assertCustomSplitTotal(1000, [333, 333, 333])).toThrow(
      "Custom split total must equal the expense amount.",
    );
  });
});

describe("parseEuroToCents", () => {
  it("parses whole and decimal euro amounts", () => {
    expect(parseEuroToCents("12")).toBe(1200);
    expect(parseEuroToCents("12.3")).toBe(1230);
    expect(parseEuroToCents("12,34")).toBe(1234);
  });

  it("rejects unsupported precision", () => {
    expect(() => parseEuroToCents("12.345")).toThrow(
      "Amount must use up to two decimal places.",
    );
  });
});

describe("euroInputValue", () => {
  it("formats cents for number inputs", () => {
    expect(euroInputValue(1234)).toBe("12.34");
  });
});
