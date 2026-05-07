import Link from "next/link";
import { CreateBookForm } from "@/components/books/create-book-form";
import { requireCurrentUser } from "@/server/auth/session";

export default async function NewBookPage() {
  await requireCurrentUser();

  return (
    <main className="auth-page">
      <div className="stack">
        <CreateBookForm />
        <Link className="button secondary" href="/books">
          Back to books
        </Link>
      </div>
    </main>
  );
}
