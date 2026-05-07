"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { requireCurrentUser } from "@/server/auth/session";
import { createInviteCode } from "@/server/books/invite-code";
import { createBookSchema, joinBookSchema } from "@/server/books/validation";

export type BookActionState = {
  error?: string;
  success?: string;
};

export async function createBookAction(
  _previousState: BookActionState,
  formData: FormData,
): Promise<BookActionState> {
  const user = await requireCurrentUser();
  const parsed = createBookSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Book name is required." };
  }

  const book = await prisma.book.create({
    data: {
      name: parsed.data.name,
      createdById: user.id,
      inviteCode: await createUniqueInviteCode(),
      members: {
        create: {
          userId: user.id,
          displayName: user.displayName,
          type: "REAL",
          role: "ADMIN",
        },
      },
    },
  });

  redirect(`/books/${book.id}`);
}

export async function joinBookAction(
  _previousState: BookActionState,
  formData: FormData,
): Promise<BookActionState> {
  const user = await requireCurrentUser();
  const parsed = joinBookSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Invite code is required." };
  }

  const inviteCode = parsed.data.inviteCode.toUpperCase();
  const book = await prisma.book.findUnique({
    where: {
      inviteCode,
    },
    include: {
      members: true,
    },
  });

  if (!book) {
    return { error: "No book found for that invite code." };
  }

  const existingMember = book.members.find((member) => member.userId === user.id);

  if (existingMember) {
    redirect(`/books/${book.id}`);
  }

  if (parsed.data.placeholderMemberId) {
    const placeholder = book.members.find(
      (member) =>
        member.id === parsed.data.placeholderMemberId &&
        member.type === "PLACEHOLDER" &&
        member.userId === null,
    );

    if (!placeholder) {
      return { error: "That placeholder member cannot be claimed." };
    }

    await prisma.bookMember.update({
      where: {
        id: placeholder.id,
      },
      data: {
        userId: user.id,
        displayName: user.displayName,
        type: "REAL",
      },
    });

    redirect(`/books/${book.id}`);
  }

  await prisma.bookMember.create({
    data: {
      bookId: book.id,
      userId: user.id,
      displayName: user.displayName,
      type: "REAL",
      role: "MEMBER",
    },
  });

  redirect(`/books/${book.id}`);
}

async function createUniqueInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const inviteCode = createInviteCode();
    const existingBook = await prisma.book.findUnique({
      where: {
        inviteCode,
      },
      select: {
        id: true,
      },
    });

    if (!existingBook) {
      return inviteCode;
    }
  }

  throw new Error("Could not create a unique invite code.");
}
