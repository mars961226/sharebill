# ShareBill

ShareBill is a web-based shared expense book for groups.

The MVP lets users create books, invite members, record shared expenses, support placeholder members before real users join, and calculate a recommended settlement path where each person pays at most one other person.

## Product Docs

- [PRD](docs/PRD.md)
- [Technical Design](docs/TECHNICAL_DESIGN.md)
- [MVP PRD Draft](docs/mvp-prd-draft.md)

## Current Implementation

Implemented so far:

- Next.js App Router + TypeScript application scaffold.
- Prisma schema and initial SQLite migration.
- Email/password registration and login.
- HTTP-only cookie sessions with a 30-day expiry.
- Logout.
- Password reset flow backend and UI.
- SMTP email abstraction for welcome and reset emails.
- Book creation, book list, book overview, and invite-code join flow.
- Book list cards with total recorded expense amounts.
- Book member list.
- Temporary member creation and admin-only deletion.
- Expense creation, editing, deletion, equal split, and custom amount split.
- Book overview balances based on recorded expenses and confirmed settlements.
- Recommended settlement path display with each member having at most one outgoing payment.
- Settlement confirmation with payer/receiver/admin permission checks.
- Settlement history.
- Per-member total consumed ranking based on participant split amounts, including tied ranks.
- Core money, balance, and settlement-path utilities with tests.

Not implemented yet:

- Placeholder member claiming during invite join UI.
- Inline temporary member creation from the expense form.
- Placeholder member rename UI.
- Invite code regeneration.
- Book settings editing.
- Mailpit/Mailhog local email service wiring.

## Local Setup

This project is scaffolded as a Next.js + TypeScript + Prisma app.

Install dependencies and create a local environment file:

```bash
cp .env.example .env
npm install
```

Initialize or update the local SQLite database:

```bash
npm run prisma:migrate
```

Start the app:

```bash
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

Local email should be tested with Mailpit or Mailhog using the SMTP values in `.env.example`.

`npm run dev` uses Next.js Turbopack because the standard webpack dev server did not reliably serve generated CSS/JS chunks in the local Codex desktop environment.

## Verification

Useful checks:

```bash
npm run test
npm run typecheck
npm run build
npm audit
```
