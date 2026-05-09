# ShareBill MVP Technical Design

Last updated: 2026-05-09

## 1. Stack Decision

Recommended MVP stack:

- Next.js App Router.
- TypeScript.
- Prisma ORM.
- SQLite for local development.
- PostgreSQL-compatible schema for future production deployment.
- Custom email/password authentication.
- SMTP-compatible email sending.
- React Server Components for data-heavy pages.
- Server Actions or route handlers for mutations.

Reasoning:

- The product is web-only for MVP.
- Backend correctness matters more than UI polish.
- Next.js keeps frontend and backend in one repo, which is faster for an MVP.
- Prisma gives a clear schema for users, books, members, expenses, and settlements.
- SQLite keeps local setup simple.
- SMTP abstraction supports Mailpit/Mailhog locally and Resend/Postmark/SendGrid/AWS SES later.

## 2. Runtime Notes

Current local environment:

- Node and npm are available through Homebrew.
- The app uses `npm` and `package-lock.json`.
- `npm run dev` runs `next dev --turbo`.
- Turbopack is used because the standard webpack dev server did not reliably serve generated CSS/JS chunks in the Codex desktop local environment.
- `next.config.ts` allows `127.0.0.1` as a local development origin so Codex's in-app browser can access Next dev assets without cross-origin warnings.

## 3. Application Architecture

The app should use a single Next.js project:

```text
src/
  app/
    (auth)/
    (dashboard)/
    api/
  components/
  lib/
  server/
  styles/
prisma/
  schema.prisma
```

Suggested separation:

- `src/app`: routes and page composition.
- `src/components`: reusable UI components.
- `src/server`: domain services and mutation logic.
- `src/lib`: shared utility code.
- `prisma`: database schema and migrations.

## 4. Core Domains

### 4.1 Authentication

Implement custom auth for MVP:

- Passwords hashed with a strong password hashing library.
- HTTP-only session cookie.
- Session stored server-side in database.
- Password reset tokens stored hashed.
- Welcome and reset emails sent through an email service abstraction.

Auth entities:

- User.
- Session.
- PasswordResetToken.

### 4.2 Books And Members

Book membership should be represented by `BookMember`, not directly by `User`, because placeholder members need to participate in expenses without a login account.

Important rule:

- Expenses, balances, and settlements reference `BookMember`.
- Real members have `userId`.
- Placeholder members have `userId = null`.
- Claiming a placeholder member sets `userId` on that existing `BookMember` and changes its type to `REAL`.
- If a user chooses to claim a placeholder during invite join, the app should claim the placeholder instead of creating a second `BookMember`.
- If a user joins without claiming a placeholder, the app creates a new real `BookMember`.
- If an existing real member later claims a placeholder, merge the placeholder ledger into that user's existing `BookMember`.
- During merge, update expense payer references from placeholder to real member.
- During merge, move `ExpenseParticipant` rows from placeholder to real member; if both rows exist on the same expense, add the placeholder owed amount into the real member row and delete the placeholder row.
- Block placeholder claim when the placeholder has participated in a confirmed settlement, because settlement history references would otherwise need an explicit correction/audit model.
- Only the currently logged-in user's member record can receive a claimed placeholder.

This preserves historical balances.

Placeholder cleanup rule:

- Admins can delete unused placeholder members.
- Admins can rename unclaimed placeholder members without changing ledger relationships.
- A placeholder member is considered used if it appears as an expense payer, expense participant, settlement payer, or settlement receiver.
- Used placeholder members must not be deleted because that would corrupt historical financial records.
- Used placeholder delete buttons should be disabled in the UI with an explanation.
- Placeholder delete and claim actions should use client-side confirmation prompts before submitting irreversible server actions.

### 4.3 Expenses

Expense data should be normalized:

- `Expense` stores the payer, title, date, amount, split method, and audit fields.
- `ExpenseParticipant` stores each participant's owed amount.
- `Expense.updatedById` records the last user who edited the expense.
- Book overview latest activity is ordered by `Expense.updatedAt` so edits surface as activity, not only original creation.

Money:

- Store all money in integer cents.
- Do not use floating point arithmetic for persisted calculations.

Expense lock rule:

- MVP uses a computed soft lock instead of adding lock fields to the database.
- For a book, find the latest confirmed settlement by `confirmedAt`.
- An expense is locked when `expense.createdAt <= latestSettlement.confirmedAt`.
- Locked expenses cannot be edited or deleted.
- This preserves the ledger state that existed when settlement was confirmed while still allowing new post-settlement expenses, even if users backdate the expense date.

Expense form behavior:

- New expense forms default `payerMemberId` to the current user's `BookMember`.
- Server action validation errors return a submitted-value snapshot so the client form can remount uncontrolled inputs with the user's previous values.
- Custom split validation should preserve title, date, amount, payer, split method, selected participants, and custom amounts after an error.
- Expense deletion should use a client-side confirmation prompt before submitting.

### 4.4 Balances

Balances can be computed on read for MVP.

Reasoning:

- Easier to keep correct.
- Avoids cache invalidation bugs.
- MVP data volume should be small.

If performance becomes a problem later, introduce cached balance snapshots.

### 4.5 Settlements

Confirmed settlements should be stored as immutable records.

MVP has:

- No pending settlement state.
- No settlement reversal.
- A client-side confirmation prompt before creating a settlement.

The recommended settlement path can be computed dynamically from current balances.

### 4.6 Consumption Statistics

Book overview includes a per-member consumption ranking.

Important distinction:

- Consumption statistics are based on `ExpenseParticipant.owedAmountCents`.
- They are not based on `Expense.payerMemberId` or payer totals.
- A member who never paid at checkout can still have a non-zero consumption total if they participated in expenses.

Ranking rules:

- Sort by total consumed amount descending.
- Members with the same consumed total share the same rank.
- The next rank skips accordingly, for example `#1`, `#1`, `#3`.
- Tied members are sorted by display name for stable output.

## 5. Settlement Algorithm

Input:

- Current net balances for every `BookMember`.

Rules:

- Positive balance means member should receive money.
- Negative balance means member should pay money.
- Zero-balance members are ignored.
- The sum of balances must be zero.

Algorithm:

```ts
function buildSettlementPath(members: Balance[]): SettlementRecommendation[] {
  const sorted = members
    .filter((member) => member.balanceCents !== 0)
    .sort((a, b) => a.balanceCents - b.balanceCents);

  const recommendations: SettlementRecommendation[] = [];
  let runningBalance = 0;

  for (let index = 0; index < sorted.length - 1; index += 1) {
    runningBalance += sorted[index].balanceCents;

    if (runningBalance < 0) {
      recommendations.push({
        fromMemberId: sorted[index].memberId,
        toMemberId: sorted[index + 1].memberId,
        amountCents: Math.abs(runningBalance),
      });
    }
  }

  return recommendations;
}
```

Guarantee:

- Each member has at most one outgoing recommended settlement.

## 6. Database Model Draft

Primary entities:

- User.
- Session.
- PasswordResetToken.
- Book.
- BookMember.
- Expense.
- ExpenseParticipant.
- Settlement.

Enums:

- BookMemberType: `REAL`, `PLACEHOLDER`.
- BookRole: `ADMIN`, `MEMBER`.
- SplitMethod: `EQUAL`, `CUSTOM`.

Key relations:

- Book has many BookMembers.
- BookMember optionally belongs to User.
- Expense payer is a BookMember.
- ExpenseParticipant belongs to Expense and BookMember.
- Settlement payer and receiver are BookMembers.

## 7. UI Structure

Routes:

- `/register`
- `/login`
- `/forgot-password`
- `/reset-password`
- `/books`
- `/books/new`
- `/join`
- `/books/[bookId]`
- `/books/[bookId]/members`
- `/books/[bookId]/expenses`
- `/books/[bookId]/settlements`

Responsive behavior:

- Desktop can use sidebar navigation within a book.
- Mobile can use bottom navigation for overview, expenses, members, and settlements.
- On the expenses page, desktop keeps the history/form two-column layout while mobile shows the add form before the expense history.
- UI can be simple but should not block core workflows.

## 8. Local Development Plan

Expected local services:

- App server.
- SQLite database file.
- Mailpit or Mailhog for local email capture.

Recommended environment variables:

```text
DATABASE_URL="file:./dev.db"
APP_URL="http://localhost:3000"
SESSION_SECRET="dev-only-change-me"
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_FROM="ShareBill <noreply@sharebill.local>"
```

## 9. Implementation Order

1. Scaffold Next.js TypeScript project. Done.
2. Add Prisma schema. Done.
3. Add core money and settlement calculation utilities. Done.
4. Add authentication and sessions. Done.
5. Add email service and local email configuration. Done.
6. Add book creation/list/join. Done.
7. Add member and placeholder member flows. Claim/delete/rename flows done; inline creation still pending.
8. Add expense CRUD. Done.
9. Add balance and settlement path pages. Done for book overview.
10. Add settlement confirmation. Done.
11. Add consumption statistics. Done for book overview.
12. Add focused tests for money, balances, and permissions.

## 10. Initial Test Focus

Highest priority tests:

- Equal split round-up.
- Custom split exact-total validation.
- Balance calculation with expenses.
- Balance calculation with confirmed settlements.
- Settlement path one-outgoing-payment guarantee.
- Placeholder member claim preserving history.
- Placeholder member claim merging same-expense participant rows.
- Placeholder member claim blocked by confirmed settlement usage.
- Permission checks for edit/delete/confirm settlement.
