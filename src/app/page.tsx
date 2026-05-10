import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <Link className="brand-mark" href="/">
          SharingBill
        </Link>
        <nav className="landing-nav" aria-label="Primary">
          <Link href="/login">Log in</Link>
          <Link className="button primary small" href="/register">
            Create account
          </Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">Shared expenses, settled cleanly</p>
          <h1>One trip, one book, one clear way to settle up.</h1>
          <p className="lead">
            SharingBill helps groups record shared spending, include people
            before they join, and calculate a simple settlement path when the
            trip is done.
          </p>
          <div className="actions">
            <Link className="button primary" href="/register">
              Start a book
            </Link>
            <Link className="button secondary" href="/login">
              Open app
            </Link>
          </div>
        </div>

        <div className="product-preview" aria-label="SharingBill app preview">
          <div className="preview-topbar">
            <span>Lisbon weekend</span>
            <strong>EUR</strong>
          </div>
          <div className="preview-balance">
            <p>Recommended settlement</p>
            <h2>Mars pays Ana €42.35</h2>
          </div>
          <div className="preview-grid">
            <div>
              <span>Food market</span>
              <strong>€86.40</strong>
            </div>
            <div>
              <span>Train tickets</span>
              <strong>€54.00</strong>
            </div>
            <div>
              <span>Museum pass</span>
              <strong>€31.50</strong>
            </div>
          </div>
          <div className="preview-ranking">
            <p>Consumed total</p>
            <ol>
              <li>
                <span>Ana</span>
                <strong>€73.30</strong>
              </li>
              <li>
                <span>Mars</span>
                <strong>€61.70</strong>
              </li>
              <li>
                <span>Temporary: Leo</span>
                <strong>€36.90</strong>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="landing-features" aria-label="Highlights">
        <article>
          <h2>Add expenses before everyone joins</h2>
          <p>
            Create temporary members, keep recording, and let real users claim
            their history later.
          </p>
        </article>
        <article>
          <h2>Split evenly or customize shares</h2>
          <p>
            Use equal split for fast entries or custom amounts when one person
            consumed more.
          </p>
        </article>
        <article>
          <h2>Settle with fewer transfers</h2>
          <p>
            See a recommended path where each person has at most one outgoing
            payment.
          </p>
        </article>
      </section>
    </main>
  );
}
