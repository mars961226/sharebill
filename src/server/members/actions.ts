"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { requireCurrentUser } from "@/server/auth/session";
import {
  claimPlaceholderMemberSchema,
  createPlaceholderMemberSchema,
  deletePlaceholderMemberSchema,
  renamePlaceholderMemberSchema,
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
  _previousState: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const user = await requireCurrentUser();
  const parsed = deletePlaceholderMemberSchema.safeParse(
    Object.fromEntries(formData),
  );

  if (!parsed.success) {
    return { error: "Temporary member is required." };
  }

  const currentMember = await prisma.bookMember.findFirst({
    where: {
      bookId: parsed.data.bookId,
      userId: user.id,
      type: "REAL",
      role: "ADMIN",
    },
    select: {
      id: true,
    },
  });

  if (!currentMember) {
    return { error: "Only book admins can delete temporary members." };
  }

  const placeholderMember = await prisma.bookMember.findFirst({
    where: {
      id: parsed.data.memberId,
      bookId: parsed.data.bookId,
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
    return { error: "Temporary member not found." };
  }

  const usageCount =
    placeholderMember._count.paidExpenses +
    placeholderMember._count.expenseParticipants +
    placeholderMember._count.settlementsPaid +
    placeholderMember._count.settlementsReceived;

  if (usageCount > 0) {
    return { error: "Temporary members used in expenses cannot be deleted." };
  }

  await prisma.bookMember.delete({
    where: {
      id: placeholderMember.id,
    },
  });

  revalidatePath(`/books/${parsed.data.bookId}`);
  revalidatePath(`/books/${parsed.data.bookId}/members`);
  return { success: "Temporary member deleted." };
}

export async function renamePlaceholderMemberAction(
  _previousState: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const user = await requireCurrentUser();
  const parsed = renamePlaceholderMemberSchema.safeParse(
    Object.fromEntries(formData),
  );

  if (!parsed.success) {
    return { error: "Temporary member name is required." };
  }

  const currentMember = await prisma.bookMember.findFirst({
    where: {
      bookId: parsed.data.bookId,
      userId: user.id,
      type: "REAL",
      role: "ADMIN",
    },
    select: {
      id: true,
    },
  });

  if (!currentMember) {
    return { error: "Only book admins can rename temporary members." };
  }

  const result = await prisma.bookMember.updateMany({
    where: {
      id: parsed.data.memberId,
      bookId: parsed.data.bookId,
      type: "PLACEHOLDER",
      userId: null,
    },
    data: {
      displayName: parsed.data.displayName.trim(),
    },
  });

  if (result.count === 0) {
    return { error: "Temporary member not found." };
  }

  revalidatePath("/books");
  revalidatePath(`/books/${parsed.data.bookId}`);
  revalidatePath(`/books/${parsed.data.bookId}/expenses`);
  revalidatePath(`/books/${parsed.data.bookId}/members`);
  return { success: "Temporary member renamed." };
}

export async function claimPlaceholderMemberAction(
  _previousState: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const user = await requireCurrentUser();
  const parsed = claimPlaceholderMemberSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Temporary member is required." };
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

  try {
    await mergePlaceholderIntoRealMember({
      bookId: parsed.data.bookId,
      placeholderMemberId: parsed.data.memberId,
      realMemberId: currentMember.id,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Temporary member could not be claimed.",
    };
  }

  revalidatePath("/books");
  revalidatePath(`/books/${parsed.data.bookId}`);
  revalidatePath(`/books/${parsed.data.bookId}/expenses`);
  revalidatePath(`/books/${parsed.data.bookId}/members`);
  return { success: "Temporary member claimed." };
}
