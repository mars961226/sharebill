import Link from "next/link";
import { notFound } from "next/navigation";
import { ClaimPlaceholderMemberForm } from "@/components/members/claim-placeholder-member-form";
import { CreatePlaceholderMemberForm } from "@/components/members/create-placeholder-member-form";
import { DeletePlaceholderMemberForm } from "@/components/members/delete-placeholder-member-form";
import { requireCurrentUser } from "@/server/auth/session";
import { prisma } from "@/server/db";

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
            include: {
              _count: {
                select: {
                  paidExpenses: true,
                  expenseParticipants: true,
                  settlementsPaid: true,
                  settlementsReceived: true,
                },
              },
            },
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
          <Link className="button secondary" href={`/books/${bookId}/expenses`}>
            Expenses
          </Link>
          <Link className="button secondary" href={`/books/${bookId}`}>
            Overview
          </Link>
          <Link className="button secondary" href="/books">
            All books
          </Link>
        </div>
      </header>

      <nav className="tab-nav" aria-label="Book navigation">
        <Link className="tab-link" href={`/books/${bookId}`}>
          Overview
        </Link>
        <Link className="tab-link" href={`/books/${bookId}/expenses`}>
          Expenses
        </Link>
        <Link className="tab-link active" href={`/books/${bookId}/members`}>
          Members
        </Link>
      </nav>

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
              {placeholderMembers.map((member) => {
                const usageCount = placeholderUsageCount(member);
                const settlementUsageCount = placeholderSettlementUsageCount(member);
                const isUsed = usageCount > 0;
                const canClaim = settlementUsageCount === 0;

                return (
                  <div className="list-row member-row" key={member.id}>
                    <div>
                      <span>{member.displayName}</span>
                      {isUsed ? (
                        <p className="field-help">
                          Used in expenses or settlements, so it cannot be deleted.
                        </p>
                      ) : null}
                    </div>
                    <div className="row-actions">
                      <strong>{isUsed ? "used" : "not joined"}</strong>
                      {canClaim ? (
                        <ClaimPlaceholderMemberForm
                          bookId={bookId}
                          displayName={member.displayName}
                          memberId={member.id}
                        />
                      ) : (
                        <button
                          className="button secondary small"
                          disabled
                          title="Temporary members used in confirmed settlements cannot be claimed yet."
                          type="button"
                        >
                          Claim
                        </button>
                      )}
                      {currentMember.role === "ADMIN" ? (
                        isUsed ? (
                          <button
                            className="button danger small"
                            disabled
                            title="Temporary members used in expenses or settlements cannot be deleted."
                            type="button"
                          >
                            Delete
                          </button>
                        ) : (
                          <DeletePlaceholderMemberForm
                            bookId={bookId}
                            displayName={member.displayName}
                            memberId={member.id}
                          />
                        )
                      ) : (
                        <button
                          className="button danger small"
                          disabled
                          title="Only book admins can delete temporary members."
                          type="button"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
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

function placeholderSettlementUsageCount(member: {
  _count: {
    settlementsPaid: number;
    settlementsReceived: number;
  };
}): number {
  return member._count.settlementsPaid + member._count.settlementsReceived;
}

function placeholderUsageCount(member: {
  _count: {
    paidExpenses: number;
    expenseParticipants: number;
    settlementsPaid: number;
    settlementsReceived: number;
  };
}): number {
  return (
    member._count.paidExpenses +
    member._count.expenseParticipants +
    member._count.settlementsPaid +
    member._count.settlementsReceived
  );
}
