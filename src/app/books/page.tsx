import Link from "next/link";
import { formatEuro } from "@/lib/money";
import { logoutAction } from "@/server/auth/actions";
import { requireCurrentUser } from "@/server/auth/session";
import { prisma } from "@/server/db";

export default async function BooksPage() {
  const user = await requireCurrentUser();
  const memberships = await prisma.bookMember.findMany({
    where: {
      userId: user.id,
    },
    include: {
      book: {
        include: {
          _count: {
            select: {
              members: true,
            },
          },
          expenses: {
            select: {
              amountCents: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Books</p>
          <h1>Your shared books</h1>
          <p className="muted">Signed in as {user.displayName}</p>
        </div>
        <div className="topbar-actions">
          <Link className="button primary" href="/books/new">
            New book
          </Link>
          <Link className="button secondary" href="/join">
            Join book
          </Link>
          <form action={logoutAction}>
            <button className="button secondary" type="submit">
              Log out
            </button>
          </form>
        </div>
      </header>
      {memberships.length > 0 ? (
        <section className="grid">
          {memberships.map((membership) => {
            const totalExpenseCents = membership.book.expenses.reduce(
              (sum, expense) => sum + expense.amountCents,
              0,
            );

            return (
              <Link
                className="book-card"
                href={`/books/${membership.book.id}`}
                key={membership.id}
              >
                <h2>{membership.book.name}</h2>
                <p>
                  {membership.book._count.members} members ·{" "}
                  {membership.role.toLowerCase()}
                </p>
                <span className="card-metric-label">Total recorded</span>
                <strong>{formatEuro(totalExpenseCents)}</strong>
              </Link>
            );
          })}
        </section>
      ) : (
        <section className="empty-state">
          <p className="eyebrow">No books yet</p>
          <h2>Create a book or join one with an invite code.</h2>
          <div className="actions">
            <Link className="button primary" href="/books/new">
              New book
            </Link>
            <Link className="button secondary" href="/join">
              Join book
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
