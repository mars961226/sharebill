import Link from "next/link";
import { JoinBookForm } from "@/components/books/join-book-form";
import { requireCurrentUser } from "@/server/auth/session";
import { prisma } from "@/server/db";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const user = await requireCurrentUser();
  const { code } = await searchParams;
  const normalizedCode = code?.trim().toUpperCase();
  const book = normalizedCode
    ? await prisma.book.findUnique({
        where: {
          inviteCode: normalizedCode,
        },
        select: {
          id: true,
          name: true,
          members: {
            select: {
              id: true,
              displayName: true,
              type: true,
              userId: true,
              _count: {
                select: {
                  settlementsPaid: true,
                  settlementsReceived: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      })
    : null;
  const realMemberCount =
    book?.members.filter((member) => member.type === "REAL").length ?? 0;
  const placeholderCount =
    book?.members.filter(
      (member) => member.type === "PLACEHOLDER" && member.userId === null,
    ).length ?? 0;
  const claimablePlaceholderOptions =
    book?.members
      .filter(
        (member) =>
          member.type === "PLACEHOLDER" &&
          member.userId === null &&
          member._count.settlementsPaid === 0 &&
          member._count.settlementsReceived === 0,
      )
      .map((member) => ({
        id: member.id,
        displayName: member.displayName,
      })) ?? [];
  const existingMember = book?.members.find((member) => member.userId === user.id);

  return (
    <main className="auth-page">
      <div className="stack">
        <JoinBookForm
          inviteCode={normalizedCode}
          inviteLookupError={
            normalizedCode && !book ? "No book found for that invite code." : undefined
          }
          bookSummary={
            book
              ? {
                  name: book.name,
                  realMemberCount,
                  placeholderCount,
                }
              : undefined
          }
          alreadyJoinedBookId={existingMember ? book?.id : undefined}
          placeholderOptions={claimablePlaceholderOptions}
        />
        <Link className="button secondary" href="/books">
          Back to books
        </Link>
      </div>
    </main>
  );
}
