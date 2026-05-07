# ShareBill MVP PRD Draft

Last updated: 2026-05-07

## 1. Product Positioning

ShareBill is a web-based shared expense book for groups.

The MVP focuses on:

- Email/password user accounts.
- Multiple shared books per user.
- Multiple members per book.
- Expense creation with payer, participants, reason, date, amount, and split details.
- Automatic settlement recommendations.
- Settlement confirmation.
- Support for placeholder members before real users join.

The MVP does not need native mobile apps. It should provide web UI layouts suitable for both desktop and mobile browsers.

## 2. Confirmed MVP Decisions

### 2.1 Platform

- Web only for MVP.
- Desktop and mobile browser layouts are required.
- Backend correctness is more important than polished UI in the first version.

### 2.2 Authentication

MVP includes:

- Email + password registration.
- Email + password login.
- Password reset through email.
- Welcome email after successful registration.

MVP does not include:

- Required email verification before using the product.

Rationale:

- Users can start immediately after registration.
- Welcome email proves the email delivery pipeline works.
- Email verification can be added later if abuse or fake accounts become a concern.

### 2.3 Books

Users can:

- Create multiple books.
- Join multiple books.
- Invite others to a book through invite link and invite code.
- View all books they belong to.

Each book can have:

- A name.
- A creator/admin.
- Real user members.
- Placeholder members.
- Expenses.
- Settlement records.

### 2.4 Book Permissions

MVP role model:

- Book admin:
  - Can manage book settings.
  - Can invite members.
  - Can manage placeholder members.
  - Can confirm any settlement in the book.
- Book member:
  - Can add expenses.
  - Can view all expenses in the book.
  - Can edit expenses created by any member.
  - Can delete expenses they created.
  - Can view settlement recommendations.
  - Can confirm settlements only if they are the payer or receiver of that settlement.

Expense deletion rule:

- Normal members can edit any expense in the book.
- Normal members can delete only expenses they created.
- Book admins can delete any expense in the book.

### 2.5 Expense Splitting

MVP supports:

- Equal split.
- Custom amount split.

MVP does not support yet:

- Percentage split.
- Share/unit split.
- Multiple payers in one expense.
- Multi-currency.
- Recurring expenses.
- Attachments or receipt OCR.

Currency rule:

- MVP uses EUR only.
- Each book is single-currency.
- Multi-currency support is explicitly out of scope for MVP.

Equal split rounding rule:

- Equal split amounts are rounded up.
- The receiver may receive slightly more than the original expense total after rounding.
- The receiver must not receive less than the original expense total.
- The rounding difference should be stored or derivable for auditability.

Custom split rule:

- Custom split amounts must exactly equal the expense total.

Each expense should record:

- Book ID.
- Title/reason.
- Expense date.
- Amount.
- Currency, fixed to EUR in MVP.
- Payer.
- Participants.
- Split method.
- Per-participant owed amount.
- Creator.
- Created time.
- Updated time.

## 3. Placeholder Member Mechanism

This is an important MVP feature.

Working name:

- Placeholder member

Chinese product wording options:

- 临时成员
- 占位成员
- 待加入成员

Recommendation:

- Use "placeholder member" internally.
- Use "待加入成员" or "临时成员" in user-facing Chinese UI.

Problem:

- A user may create a book and start recording expenses before all real members have joined.
- Some expenses may involve people who are not yet registered or have not joined the book.
- Without placeholder members, the user cannot accurately record historical expenses.

MVP behavior:

- Any existing book member can create a placeholder member with a display nickname.
- Placeholder members can be selected as payers and/or participants in expenses.
- Placeholder members appear in balances and settlement recommendations.
- Placeholder members do not have login credentials.
- Placeholder members cannot perform actions.
- When the real person joins later, the book admin or the joining user can link that real user account to the placeholder member.

Recommended linking flow:

1. Admin creates placeholder member, for example "Alex".
2. Expenses are recorded with "Alex" as payer or participant.
3. Alex later joins through invite link/code.
4. System shows available placeholder members and asks whether Alex should claim one.
5. Alex claims the matching placeholder member without admin approval.
6. After linking, historical expenses remain unchanged, but the participant identity now points to the real user.

Important rule:

- Linking a real user to a placeholder member should preserve all historical expenses and balances.
- It should not create a new member balance from zero.
- Placeholder member claiming does not require admin approval in MVP.

Confirmed MVP rule:

- Yes, any member can create placeholder members while adding an expense.
- Admin can rename, merge, or link placeholder members later.
- Admin can delete unused placeholder members before they are used in expenses or settlements.

## 4. Settlement Logic

### 4.1 Balance Calculation

For each book:

1. Calculate expense obligations.
2. For each expense:
   - Payer is credited for the amount they paid.
   - Participants are debited by their split amounts.
3. Apply confirmed settlement records as balance adjustments.
4. Compute each member's net balance:
   - Positive means the member should receive money.
   - Negative means the member should pay money.

Current balance formula:

```text
net balance = amount paid for group - amount owed for participation + amount received through settlements - amount paid through settlements
```

This formula should be validated carefully during implementation.

### 4.2 Settlement Mode

Confirmed MVP mode:

- Settlement Mode B: each person pays at most one person.

Meaning:

- The system generates a recommended settlement path where each debtor has at most one outgoing payment.
- This may involve intermediate transfers.
- A person who should receive money overall may still need to forward part of a payment to another receiver depending on the generated path.

Product wording:

- Use "recommended settlement path" instead of "exact debt relationship".

Reason:

- This is not always the literal direct debt between original expense participants.
- It is a simplified path that clears the book balances.

### 4.3 Settlement Confirmation

Confirmed MVP rule:

- A settlement can be confirmed by either the payer or the receiver.
- Other unrelated members cannot confirm it.
- Book admin can confirm any settlement in the book.

When a settlement is confirmed:

- Create a settlement record.
- Mark it as confirmed.
- Apply it to future balance calculations.
- Do not delete or mutate the historical expenses.
- Confirmed settlements cannot be revoked in MVP.

Settlement status rule:

- For MVP, clicking confirm immediately creates a confirmed settlement.
- There is no pending settlement state in MVP.
- Add pending/double-confirmation later if users need stronger audit control.

### 4.4 Date Rules

- Expense dates cannot be in the future in MVP.
- Future or scheduled expenses are out of scope for MVP.

## 5. Local Email Testing Recommendation

MVP needs email sending for:

- Welcome email.
- Password reset email.

Recommended local development setup:

- Use a local email catcher such as Mailpit or Mailhog.
- The app sends email through SMTP to the local catcher.
- Developer opens a local web UI to inspect emails.

Example local flow:

1. Start the app.
2. Start Mailpit/Mailhog.
3. Register with any test email address, such as `test@example.com`.
4. Confirm the welcome email appears in the local mail UI.
5. Trigger password reset.
6. Open the reset link from the captured email.
7. Set a new password.
8. Log in with the new password.

Production email providers to consider later:

- Resend.
- Postmark.
- SendGrid.
- AWS SES.

Initial recommendation:

- Use an SMTP-compatible abstraction so local and production email providers can be swapped through environment variables.

## 6. MVP Pages

### 6.1 Auth

- Register.
- Login.
- Forgot password.
- Reset password.

User profile rule:

- Users have a display name independent of email.
- During registration, users can provide a display name.
- If no display name is provided, use the email prefix as the default display name.

### 6.2 Book List

- Show books the user belongs to.
- Create book.
- Join book by invite code.
- Open book.

### 6.3 Book Overview

- Summary balances.
- Recommended settlement path.
- Quick add expense button.
- Recent expenses.
- Member list preview.

### 6.4 Expenses

- Expense list.
- Add expense.
- Edit any expense in the book.
- Delete own expense.
- Admin delete any expense.

### 6.5 Members

- Real members.
- Placeholder members.
- Invite link/code.
- Link placeholder member to real user.
- Admin member management.

Invite rule:

- Invite links and invite codes do not expire by time in MVP.
- Admin can regenerate the invite link/code.
- Regenerating the invite link/code invalidates the previous one.

### 6.6 Settlements

- Current recommended settlement path.
- Settlement history.
- Confirm settlement.

## 7. Non-MVP Scope

Do not build in MVP:

- Native iOS or Android apps.
- Bank/payment integrations.
- Actual money transfer.
- Email verification requirement.
- Receipt upload.
- OCR.
- Multi-currency.
- Advanced charts.
- Budgeting.
- Categories/tags unless needed for basic expense reason.
- Comments.
- Notifications beyond email for welcome/reset.
- Complex role system.

## 8. Important Open Questions

No blocking MVP product questions remain at this stage.

Future PRD work should still specify detailed validation messages, API contracts, and exact UI copy.

## 9. Initial Product Assumptions

- Each expense has exactly one payer in MVP.
- Each book uses EUR only in MVP.
- Custom split totals must equal the expense total.
- Equal split rounding should always round up, and the rounding difference should be deterministic and auditable.
- Admin can perform recovery actions when members make mistakes.
- Historical records should be preserved instead of overwritten whenever possible.

## 10. Next PRD Step

Before implementation, convert this draft into a full PRD with:

- User stories.
- Data model.
- Permission matrix.
- Settlement algorithm specification.
- API requirements.
- Page-level requirements.
- Validation rules.
- Acceptance criteria.
- MVP test plan.
