import { describe, expect, it } from "vitest";
import {
  canConfirmSettlement,
  canDeleteExpense,
  canEditExpense,
  type BookMemberContext,
} from "@/lib/permissions";

const admin: BookMemberContext = {
  role: "ADMIN",
  userId: "admin-user",
};

const member: BookMemberContext = {
  role: "MEMBER",
  userId: "member-user",
};

const otherMember: BookMemberContext = {
  role: "MEMBER",
  userId: "other-user",
};

const placeholder: BookMemberContext = {
  role: "MEMBER",
  userId: null,
};

describe("expense permissions", () => {
  it("allows real members to edit expenses regardless of creator", () => {
    expect(canEditExpense(member)).toBe(true);
    expect(canEditExpense(admin)).toBe(true);
  });

  it("does not allow placeholder members to edit expenses", () => {
    expect(canEditExpense(placeholder)).toBe(false);
  });

  it("does not allow normal members to delete expenses created by others", () => {
    expect(canDeleteExpense(member, otherMember.userId ?? "")).toBe(false);
  });

  it("allows normal members to delete their own expenses", () => {
    expect(canDeleteExpense(member, member.userId ?? "")).toBe(true);
  });

  it("allows admins to delete any unlocked expense", () => {
    expect(canDeleteExpense(admin, member.userId ?? "")).toBe(true);
    expect(canDeleteExpense(admin, otherMember.userId ?? "")).toBe(true);
  });
});

describe("settlement permissions", () => {
  it("does not allow unrelated normal members to confirm another pair's settlement", () => {
    expect(
      canConfirmSettlement({
        member: otherMember,
        currentMemberId: "other-member",
        payerMemberId: "payer-member",
        receiverMemberId: "receiver-member",
      }),
    ).toBe(false);
  });

  it("allows the payer to confirm settlement", () => {
    expect(
      canConfirmSettlement({
        member,
        currentMemberId: "payer-member",
        payerMemberId: "payer-member",
        receiverMemberId: "receiver-member",
      }),
    ).toBe(true);
  });

  it("allows the receiver to confirm settlement", () => {
    expect(
      canConfirmSettlement({
        member,
        currentMemberId: "receiver-member",
        payerMemberId: "payer-member",
        receiverMemberId: "receiver-member",
      }),
    ).toBe(true);
  });

  it("allows admins to confirm any settlement", () => {
    expect(
      canConfirmSettlement({
        member: admin,
        currentMemberId: "admin-member",
        payerMemberId: "payer-member",
        receiverMemberId: "receiver-member",
      }),
    ).toBe(true);
  });
});
