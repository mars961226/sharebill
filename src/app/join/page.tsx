import Link from "next/link";
import { JoinBookForm } from "@/components/books/join-book-form";
import { requireCurrentUser } from "@/server/auth/session";
import { prisma } from "@/server/db";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  await requireCurrentUser();
  const { code } = await searchParams;
  const book = code
    ? await prisma.book.findUnique({
        where: {
          inviteCode: code.toUpperCase(),
        },
        select: {
          members: {
            where: {
              type: "PLACEHOLDER",
              userId: null,
            },
            select: {
              id: true,
              displayName: true,
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
  const claimablePlaceholderOptions =
    book?.members
      .filter(
        (member) =>
          member._count.settlementsPaid === 0 &&
          member._count.settlementsReceived === 0,
      )
      .map((member) => ({
        id: member.id,
        displayName: member.displayName,
      })) ?? [];

  return (
    <main className="auth-page">
      <div className="stack">
        <JoinBookForm
          inviteCode={code}
          placeholderOptions={claimablePlaceholderOptions}
        />
        <Link className="button secondary" href="/books">
          Back to books
        </Link>
      </div>
    </main>
  );
}
