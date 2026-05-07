import Link from "next/link";
import { notFound } from "next/navigation";
import { CreatePlaceholderMemberForm } from "@/components/members/create-placeholder-member-form";
import { requireCurrentUser } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { deletePlaceholderMemberAction } from "@/server/members/actions";

export default async function BookMembersPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const user = await requireCurrentUser();
  const { bookId } = await params;

  const currentMember = await prisma.bookMember.findFirst({
    where: {
      bookId,
      userId: user.id,
      type: "REAL",
    },
    include: {
      book: {
        include: {
          members: {
            orderBy: [{ type: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });

  if (!currentMember) {
    notFound();
  }

  const realMembers = currentMember.book.members.filter(
    (member) => member.type === "REAL",
  );
  const placeholderMembers = currentMember.book.members.filter(
    (member) => member.type === "PLACEHOLDER",
  );

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Members</p>
          <h1>{currentMember.book.name}</h1>
          <p className="muted">
            {realMembers.length} real · {placeholderMembers.length} temporary
          </p>
        </div>
        <div className="topbar-actions">
          <Link className="button secondary" href={`/books/${bookId}`}>
            Overview
          </Link>
          <Link className="button secondary" href="/books">
            All books
          </Link>
        </div>
      </header>

      <section className="two-column">
        <div className="section-block">
          <p className="eyebrow">Current members</p>
          <div className="list">
            {realMembers.map((member) => (
              <div className="list-row" key={member.id}>
                <span>{member.displayName}</span>
                <strong>{member.role.toLowerCase()}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="section-block">
          <p className="eyebrow">Temporary members</p>
          {placeholderMembers.length > 0 ? (
            <div className="list">
              {placeholderMembers.map((member) => (
                <div className="list-row" key={member.id}>
                  <span>{member.displayName}</span>
                  <div className="row-actions">
                    <strong>not joined</strong>
                    {currentMember.role === "ADMIN" ? (
                      <form action={deletePlaceholderMemberAction}>
                        <input name="bookId" type="hidden" value={bookId} />
                        <input name="memberId" type="hidden" value={member.id} />
                        <button className="button danger small" type="submit">
                          Delete
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">
              Add temporary members before they join so expenses can include
              them later.
            </p>
          )}
        </div>
      </section>

      <section className="form-section">
        <CreatePlaceholderMemberForm bookId={bookId} />
      </section>
    </main>
  );
}
