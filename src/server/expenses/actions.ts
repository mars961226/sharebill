"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertCustomSplitTotal, equalSplit, parseEuroToCents } from "@/lib/money";
import { canDeleteExpense } from "@/lib/permissions";
import { requireCurrentUser } from "@/server/auth/session";
import { prisma } from "@/server/db";

export type ExpenseActionState = {
  error?: string;
  success?: string;
};

type ParticipantSplit = {
  memberId: string;
  owedAmountCents: number;
};

export async function createExpenseAction(
  _previousState: ExpenseActionState,
  formData: FormData,
): Promise<ExpenseActionState> {
  const user = await requireCurrentUser();
  const parsed = await parseExpenseForm(formData);

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const currentMember = await getCurrentMember(parsed.bookId, user.id);

  if (!currentMember) {
    return { error: "You do not have access to this book." };
  }

  const memberIds = await getBookMemberIds(parsed.bookId);
  const validationError = validateMemberSelection(parsed, memberIds);

  if (validationError) {
    return { error: validationError };
  }

  await prisma.expense.create({
    data: {
      bookId: parsed.bookId,
      title: parsed.title,
      expenseDate: parsed.expenseDate,
      amountCents: parsed.amountCents,
      currency: "EUR",
      payerMemberId: parsed.payerMemberId,
      splitMethod: parsed.splitMethod,
      splitTotalCents: parsed.splitTotalCents,
      roundingDifferenceCents: parsed.roundingDifferenceCents,
      createdById: user.id,
      participants: {
        create: parsed.participants.map((participant) => ({
          memberId: participant.memberId,
          owedAmountCents: participant.owedAmountCents,
        })),
      },
    },
  });

  revalidateExpensePaths(parsed.bookId);
  redirect(`/books/${parsed.bookId}/expenses`);
}

export async function updateExpenseAction(
  _previousState: ExpenseActionState,
  formData: FormData,
): Promise<ExpenseActionState> {
  const user = await requireCurrentUser();
  const expenseId = readString(formData, "expenseId");
  const parsed = await parseExpenseForm(formData);

  if (!expenseId) {
    return { error: "Expense is required." };
  }

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const currentMember = await getCurrentMember(parsed.bookId, user.id);

  if (!currentMember) {
    return { error: "You do not have access to this book." };
  }

  const expense = await prisma.expense.findFirst({
    where: {
      id: expenseId,
      bookId: parsed.bookId,
    },
    select: {
      id: true,
    },
  });

  if (!expense) {
    return { error: "Expense not found." };
  }

  const memberIds = await getBookMemberIds(parsed.bookId);
  const validationError = validateMemberSelection(parsed, memberIds);

  if (validationError) {
    return { error: validationError };
  }

  await prisma.$transaction(async (tx) => {
    await tx.expenseParticipant.deleteMany({
      where: {
        expenseId,
      },
    });

    await tx.expense.update({
      where: {
        id: expenseId,
      },
      data: {
        title: parsed.title,
        expenseDate: parsed.expenseDate,
        amountCents: parsed.amountCents,
        payerMemberId: parsed.payerMemberId,
        splitMethod: parsed.splitMethod,
        splitTotalCents: parsed.splitTotalCents,
        roundingDifferenceCents: parsed.roundingDifferenceCents,
        participants: {
          create: parsed.participants.map((participant) => ({
            memberId: participant.memberId,
            owedAmountCents: participant.owedAmountCents,
          })),
        },
      },
    });
  });

  revalidateExpensePaths(parsed.bookId);
  redirect(`/books/${parsed.bookId}/expenses`);
}

export async function deleteExpenseAction(formData: FormData): Promise<void> {
  const user = await requireCurrentUser();
  const bookId = readString(formData, "bookId");
  const expenseId = readString(formData, "expenseId");

  if (!bookId || !expenseId) {
    throw new Error("Expense is required.");
  }

  const currentMember = await getCurrentMember(bookId, user.id);

  if (!currentMember) {
    throw new Error("You do not have access to this book.");
  }

  const expense = await prisma.expense.findFirst({
    where: {
      id: expenseId,
      bookId,
    },
    select: {
      id: true,
      createdById: true,
    },
  });

  if (!expense) {
    throw new Error("Expense not found.");
  }

  if (!canDeleteExpense(currentMember, expense.createdById)) {
    throw new Error("You can only delete expenses you created.");
  }

  await prisma.expense.delete({
    where: {
      id: expense.id,
    },
  });

  revalidateExpensePaths(bookId);
}

async function parseExpenseForm(
  formData: FormData,
): Promise<
  | {
      bookId: string;
      title: string;
      expenseDate: Date;
      amountCents: number;
      payerMemberId: string;
      splitMethod: "EQUAL" | "CUSTOM";
      participants: ParticipantSplit[];
      splitTotalCents: number;
      roundingDifferenceCents: number;
    }
  | { error: string }
> {
  const bookId = readString(formData, "bookId");
  const title = readString(formData, "title");
  const payerMemberId = readString(formData, "payerMemberId");
  const splitMethod = readString(formData, "splitMethod");
  const expenseDateInput = readString(formData, "expenseDate");

  if (!bookId || !title || !payerMemberId || !expenseDateInput) {
    return { error: "Title, date, amount, payer, and participants are required." };
  }

  if (splitMethod !== "EQUAL" && splitMethod !== "CUSTOM") {
    return { error: "Choose a split method." };
  }

  const expenseDate = new Date(`${expenseDateInput}T12:00:00.000`);

  if (Number.isNaN(expenseDate.getTime())) {
    return { error: "Expense date is invalid." };
  }

  if (expenseDate.getTime() > Date.now()) {
    return { error: "Expense date cannot be in the future." };
  }

  let amountCents: number;

  try {
    amountCents = parseEuroToCents(formData.get("amount"));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Amount is invalid." };
  }

  if (amountCents <= 0) {
    return { error: "Amount must be greater than zero." };
  }

  const participantMemberIds = formData
    .getAll("participantMemberIds")
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  if (participantMemberIds.length === 0) {
    return { error: "Choose at least one participant." };
  }

  const uniqueParticipantMemberIds = [...new Set(participantMemberIds)];

  if (splitMethod === "EQUAL") {
    const split = equalSplit(amountCents, uniqueParticipantMemberIds.length);

    return {
      bookId,
      title,
      expenseDate,
      amountCents,
      payerMemberId,
      splitMethod,
      participants: uniqueParticipantMemberIds.map((memberId) => ({
        memberId,
        owedAmountCents: split.perParticipantCents,
      })),
      splitTotalCents: split.splitTotalCents,
      roundingDifferenceCents: split.roundingDifferenceCents,
    };
  }

  const participants: ParticipantSplit[] = [];

  for (const memberId of uniqueParticipantMemberIds) {
    try {
      const owedAmountCents = parseEuroToCents(formData.get(`customAmount:${memberId}`));

      if (owedAmountCents <= 0) {
        return { error: "Custom participant amounts must be greater than zero." };
      }

      participants.push({ memberId, owedAmountCents });
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? `Custom split for a selected participant is invalid: ${error.message}`
            : "Custom split is invalid.",
      };
    }
  }

  try {
    assertCustomSplitTotal(
      amountCents,
      participants.map((participant) => participant.owedAmountCents),
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Custom split is invalid." };
  }

  return {
    bookId,
    title,
    expenseDate,
    amountCents,
    payerMemberId,
    splitMethod,
    participants,
    splitTotalCents: amountCents,
    roundingDifferenceCents: 0,
  };
}

async function getCurrentMember(bookId: string, userId: string) {
  return prisma.bookMember.findFirst({
    where: {
      bookId,
      userId,
      type: "REAL",
    },
    select: {
      id: true,
      role: true,
      userId: true,
    },
  });
}

async function getBookMemberIds(bookId: string): Promise<Set<string>> {
  const members = await prisma.bookMember.findMany({
    where: {
      bookId,
    },
    select: {
      id: true,
    },
  });

  return new Set(members.map((member) => member.id));
}

function validateMemberSelection(
  parsed: {
    payerMemberId: string;
    participants: ParticipantSplit[];
  },
  memberIds: Set<string>,
): string | null {
  if (!memberIds.has(parsed.payerMemberId)) {
    return "Payer must belong to this book.";
  }

  for (const participant of parsed.participants) {
    if (!memberIds.has(participant.memberId)) {
      return "Every participant must belong to this book.";
    }
  }

  return null;
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function revalidateExpensePaths(bookId: string): void {
  revalidatePath("/books");
  revalidatePath(`/books/${bookId}`);
  revalidatePath(`/books/${bookId}/expenses`);
}
