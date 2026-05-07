import { describe, expect, it } from "vitest";
import { assertCustomSplitTotal, equalSplit } from "@/lib/money";

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
