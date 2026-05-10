# SharingBill

SharingBill is a web-based shared expense book for groups.

The MVP lets users create books, invite members, record shared expenses, support placeholder members before real users join, and calculate a recommended settlement path where each person pays at most one other person.

## Product Docs

- [PRD](docs/PRD.md)
- [Technical Design](docs/TECHNICAL_DESIGN.md)
- [MVP PRD Draft](docs/mvp-prd-draft.md)

## Current Implementation

Implemented so far:

- Next.js App Router + TypeScript application scaffold.
- Prisma schema and PostgreSQL baseline migration for deployment.
- Email/password registration and login.
- HTTP-only cookie sessions with a 30-day expiry.
- Logout.
- Password reset flow backend and UI.
- Email abstraction for welcome and reset emails, using Mailpit locally and Resend's HTTPS API in production.
- Book creation, book list, book overview, and invite-code join flow.
- Book list cards with total recorded expense amounts.
- Book member list.
- Temporary member creation, rename, admin-only deletion, used-member delete blocking, and self-claim.
- Invite join choice between joining as yourself or claiming an available temporary member.
- Expense creation, editing, deletion, equal split, and custom amount split.
- Expense add form defaults the payer to the logged-in member.
- Custom split validation preserves submitted form values after validation errors.
- Destructive delete actions show confirmation prompts.
- Book overview balances based on recorded expenses and confirmed settlements.
- Recommended settlement path display with each member having at most one outgoing payment.
- Settlement confirmation with payer/receiver/admin permission checks.
- Settlement confirmation prompt before writing irreversible settlement records.
- Settlement history.
- Soft locking of expenses that existed before a confirmed settlement.
- Expense history shows both spent date and added date.
- Expense edits track the last editing user and appear in overview latest activity.
- Mobile expense page layout shows the add form before expense history.
- Per-member total consumed ranking based on participant split amounts, including tied ranks.
- Core money, balance, settlement-path, and placeholder-claim utilities with tests.

Not implemented yet:

- Inline temporary member creation from the expense form.
- Invite code regeneration.
- Book settings editing.

## Local Setup

This project is scaffolded as a Next.js + TypeScript + Prisma app.

Install dependencies and create a local environment file:

```bash
cp .env.example .env
npm install
```

Use a PostgreSQL database for local development. The same Prisma schema is used in
production, so local development should point `DATABASE_URL` at a Postgres
database instead of SQLite:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

Initialize or update the local database:

```bash
npm run prisma:migrate
```

Start the app:

```bash
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

## Local Email Testing

SharingBill sends welcome and password reset emails through the email abstraction.
For local development, use SMTP with Mailpit as a local inbox instead of sending
real external email.

Install and start Mailpit:

```bash
brew install mailpit
brew services start mailpit
```

Make sure `.env` has:

```env
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_SECURE="false"
SMTP_FROM="SharingBill <noreply@sharingbill.local>"
RESEND_API_KEY=""
```

Open the Mailpit inbox at [http://localhost:8025](http://localhost:8025).

Recommended manual test flow:

1. Start Mailpit.
2. Start SharingBill with `npm run dev`.
3. Register a new test account and confirm the welcome email appears in Mailpit.
4. Use `/forgot-password` for that email address.
5. Open the password reset email in Mailpit.
6. Follow the reset link, set a new password, and log in with the new password.

`npm run dev` uses Next.js Turbopack because the standard webpack dev server did not reliably serve generated CSS/JS chunks in the local Codex desktop environment.

## Verification

Useful checks:

```bash
npm run test
npm run typecheck
npm run build
npm audit
```

## Railway Deployment

The recommended MVP deployment path is Railway + PostgreSQL.

Railway setup:

1. Create a Railway project from the GitHub repository.
2. Add a PostgreSQL database service.
3. In the Next.js service variables, reference the database service's `DATABASE_URL`.
4. Set the remaining production variables. Railway blocks outbound SMTP on
   non-Pro plans, so production should use Resend's HTTPS API instead of SMTP:

```env
APP_URL="https://app.sharingbill.com"
SESSION_SECRET="replace-with-a-long-random-secret"
SMTP_FROM="SharingBill <noreply@sharingbill.com>"
RESEND_API_KEY="re_..."
```

The repository includes `railway.json` with:

- `buildCommand`: `npm run build`
- `startCommand`: `npm run start`
- `preDeployCommand`: `npx prisma migrate deploy`
- healthcheck path: `/login`

`npm run start` binds the standalone Next.js server to `0.0.0.0`, which is
required for Railway's public router and healthcheck to reach the container.

Production uses two custom domains:

- `https://app.sharingbill.com` for the application and all auth/invite links.
- `https://www.sharingbill.com` for the public landing page.

After changing `APP_URL` or domain routing, redeploy once and run the manual
smoke test for registration, login, forgot password, invite join, placeholder
claim, expense CRUD, and settlement confirmation.
