import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { requireCurrentUser } from "@/server/auth/session";

export default async function BookOverviewPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const user = await requireCurrentUser();
  const { bookId } = await params;

  const member = await prisma.bookMember.findFirst({
    where: {
      bookId,
      userId: user.id,
    },
    include: {
      book: {
        include: {
          members: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
    },
  });

  if (!member) {
    notFound();
  }

  const inviteUrl = `${process.env.APP_URL ?? "http://127.0.0.1:3000"}/join?code=${
    member.book.inviteCode
  }`;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Book overview</p>
          <h1>{member.book.name}</h1>
          <p className="muted">
            {member.role.toLowerCase()} · {member.book.members.length} members
          </p>
        </div>
        <div className="topbar-actions">
          <Link className="button primary" href={`/books/${bookId}/members`}>
            Members
          </Link>
          <Link className="button secondary" href="/books">
            Back to books
          </Link>
        </div>
      </header>

      <nav className="tab-nav" aria-label="Book navigation">
        <Link className="tab-link active" href={`/books/${bookId}`}>
          Overview
        </Link>
        <Link className="tab-link" href={`/books/${bookId}/members`}>
          Members
        </Link>
      </nav>

      <section className="two-column">
        <div className="section-block">
          <p className="eyebrow">Invite code</p>
          <h2>{member.book.inviteCode}</h2>
          <p className="muted">{inviteUrl}</p>
        </div>
        <div className="section-block">
          <p className="eyebrow">Members</p>
          <div className="list">
            {member.book.members.map((bookMember) => (
              <div className="list-row" key={bookMember.id}>
                <span>{bookMember.displayName}</span>
                <strong>
                  {bookMember.type === "PLACEHOLDER"
                    ? "temporary"
                    : bookMember.role.toLowerCase()}
                </strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
