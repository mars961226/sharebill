import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">ShareBill MVP</p>
          <h1>Split group expenses and settle cleanly.</h1>
          <p className="lead">
            Create shared books, record expenses before everyone joins, and get
            a recommended settlement path where each person pays at most one
            other person.
          </p>
          <div className="actions">
            <Link className="button primary" href="/register">
              Create account
            </Link>
            <Link className="button secondary" href="/login">
              Log in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
