import Link from "next/link";
import { JoinBookForm } from "@/components/books/join-book-form";
import { requireCurrentUser } from "@/server/auth/session";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  await requireCurrentUser();
  const { code } = await searchParams;

  return (
    <main className="auth-page">
      <div className="stack">
        <JoinBookForm inviteCode={code} />
        <Link className="button secondary" href="/books">
          Back to books
        </Link>
      </div>
    </main>
  );
}
