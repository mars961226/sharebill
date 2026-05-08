"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { requireCurrentUser } from "@/server/auth/session";
import {
  claimPlaceholderMemberSchema,
  createPlaceholderMemberSchema,
  deletePlaceholderMemberSchema,
} from "@/server/members/validation";
import { mergePlaceholderIntoRealMember } from "@/server/members/claim";

export type MemberActionState = {
  error?: string;
  success?: string;
};

export async function createPlaceholderMemberAction(
  _previousState: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const user = await requireCurrentUser();
  const parsed = createPlaceholderMemberSchema.safeParse(
    Object.fromEntries(formData),
  );

  if (!parsed.success) {
    return { error: "Member name is required." };
  }

  const currentMember = await prisma.bookMember.findFirst({
    where: {
      bookId: parsed.data.bookId,
      userId: user.id,
      type: "REAL",
    },
    select: {
      id: true,
    },
  });

  if (!currentMember) {
    return { error: "You do not have access to this book." };
  }

  await prisma.bookMember.create({
    data: {
      bookId: parsed.data.bookId,
      displayName: parsed.data.displayName.trim(),
      type: "PLACEHOLDER",
      role: "MEMBER",
    },
  });

  revalidatePath(`/books/${parsed.data.bookId}`);
  revalidatePath(`/books/${parsed.data.bookId}/members`);

  return { success: "Temporary member added." };
}

export async function deletePlaceholderMemberAction(
  formData: FormData,
): Promise<void> {
  const user = await requireCurrentUser();
  const parsed = deletePlaceholderMemberSchema.parse(
    Object.fromEntries(formData),
  );

  const currentMember = await prisma.bookMember.findFirst({
    where: {
      bookId: parsed.bookId,
      userId: user.id,
      type: "REAL",
      role: "ADMIN",
    },
    select: {
      id: true,
    },
  });

  if (!currentMember) {
    throw new Error("Only book admins can delete temporary members.");
  }

  const placeholderMember = await prisma.bookMember.findFirst({
    where: {
      id: parsed.memberId,
      bookId: parsed.bookId,
      type: "PLACEHOLDER",
      userId: null,
    },
    select: {
      id: true,
      _count: {
        select: {
          paidExpenses: true,
          expenseParticipants: true,
          settlementsPaid: true,
          settlementsReceived: true,
        },
      },
    },
  });

  if (!placeholderMember) {
    throw new Error("Temporary member not found.");
  }

  const usageCount =
    placeholderMember._count.paidExpenses +
    placeholderMember._count.expenseParticipants +
    placeholderMember._count.settlementsPaid +
    placeholderMember._count.settlementsReceived;

  if (usageCount > 0) {
    throw new Error("Temporary members used in expenses cannot be deleted.");
  }

  await prisma.bookMember.delete({
    where: {
      id: placeholderMember.id,
    },
  });

  revalidatePath(`/books/${parsed.bookId}`);
  revalidatePath(`/books/${parsed.bookId}/members`);
}

export async function claimPlaceholderMemberAction(
  formData: FormData,
): Promise<void> {
  const user = await requireCurrentUser();
  const parsed = claimPlaceholderMemberSchema.parse(Object.fromEntries(formData));

  const currentMember = await prisma.bookMember.findFirst({
    where: {
      bookId: parsed.bookId,
      userId: user.id,
      type: "REAL",
    },
    select: {
      id: true,
    },
  });

  if (!currentMember) {
    throw new Error("You do not have access to this book.");
  }

  await mergePlaceholderIntoRealMember({
    bookId: parsed.bookId,
    placeholderMemberId: parsed.memberId,
    realMemberId: currentMember.id,
  });

  revalidatePath("/books");
  revalidatePath(`/books/${parsed.bookId}`);
  revalidatePath(`/books/${parsed.bookId}/expenses`);
  revalidatePath(`/books/${parsed.bookId}/members`);
}
