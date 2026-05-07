import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="auth-page">
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <section className="panel">
          <div>
            <p className="eyebrow">Account help</p>
            <h1>Invalid reset link</h1>
          </div>
          <p className="muted">Request a new reset link to continue.</p>
          <Link className="button primary" href="/forgot-password">
            Request reset link
          </Link>
        </section>
      )}
    </main>
  );
}
