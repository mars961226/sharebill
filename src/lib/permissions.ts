export type BookRole = "ADMIN" | "MEMBER";

export type BookMemberContext = {
  role: BookRole;
  userId: string | null;
};

export function canEditExpense(member: BookMemberContext): boolean {
  return member.userId !== null;
}

export function canDeleteExpense(
  member: BookMemberContext,
  expenseCreatorUserId: string,
): boolean {
  if (member.role === "ADMIN") {
    return true;
  }

  return member.userId === expenseCreatorUserId;
}

export function canConfirmSettlement({
  member,
  currentMemberId,
  payerMemberId,
  receiverMemberId,
}: {
  member: BookMemberContext;
  currentMemberId: string;
  payerMemberId: string;
  receiverMemberId: string;
}): boolean {
  if (member.role === "ADMIN") {
    return true;
  }

  return currentMemberId === payerMemberId || currentMemberId === receiverMemberId;
}
