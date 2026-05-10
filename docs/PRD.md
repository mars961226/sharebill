# ShareBill MVP PRD

Last updated: 2026-05-09

## 1. Overview

ShareBill is a web-based shared expense book for groups. Users can create or join shared books, record expenses involving multiple people, and use the system-generated settlement path to clear balances.

The MVP prioritizes correct backend behavior, simple web workflows, and a usable responsive UI for desktop and mobile browsers. Native mobile apps are out of scope.

## 2. Goals

- Let users register and log in with email and password.
- Let users create and join multiple shared books.
- Let book members record expenses before or after all real users have joined.
- Let expenses support one payer, multiple participants, equal split, and custom amount split.
- Let the system calculate member balances and recommend a settlement path.
- Ensure each person has at most one outgoing settlement payment in the recommended path.
- Let eligible users confirm settlements.
- Let members review per-person total consumed amounts at the end of a book.
- Preserve historical expense and settlement records.

## 3. Non-Goals

The MVP will not include:

- Native iOS or Android apps.
- Real money transfer.
- Bank, card, PayPal, Alipay, or WeChat Pay integrations.
- Required email verification.
- Multi-currency support.
- Multiple payers for one expense.
- Percentage split or share/unit split.
- Receipt upload or OCR.
- Recurring expenses.
- Budgeting.
- Advanced reporting or charts.
- Comments.
- Push notifications.
- Complex custom roles.

## 4. Personas

### 4.1 Book Creator

A user who creates a book for a trip, household, shared activity, or group purchase. They need to invite others, record early expenses, and manage member cleanup.

### 4.2 Book Member

A user who joins an existing book, records expenses, edits mistakes, checks balances, and confirms settlements relevant to them.

### 4.3 Placeholder Member

A non-login member record used when the real person has not joined the book yet. Placeholder members can appear as payers and participants, but cannot perform actions.

## 5. Platform Requirements

- MVP is web only.
- Desktop and mobile browser layouts are required.
- The UI can be simple, but all workflows must be functional.
- Backend correctness is more important than visual polish in MVP.

## 6. Authentication And Account Requirements

### 6.1 Registration

Users can register with:

- Email.
- Password.
- Optional display name.

If display name is empty, the system uses the email prefix as the default display name.

After successful registration:

- User can use the product immediately.
- System sends a welcome email.
- Email verification is not required in MVP.

### 6.2 Login

Users can log in with:

- Email.
- Password.

### 6.3 Password Reset

Users can request a password reset by email.

Requirements:

- System sends a reset email containing a reset link.
- Reset token must expire.
- Recommended expiry: 30 minutes.
- Reset token must be single-use.
- After successful reset, user can log in with the new password.

### 6.4 Local Email Testing

MVP development should support local email testing through an SMTP-compatible local email catcher such as Mailpit or Mailhog.

Local test flow:

1. Start the app.
2. Start the local email catcher.
3. Register with any test email.
4. Confirm the welcome email appears in the local inbox UI.
5. Trigger password reset.
6. Open the reset link from the captured email.
7. Set a new password.
8. Log in with the new password.

Production email providers can be chosen later, such as Resend, Postmark, SendGrid, or AWS SES.

## 7. Book Requirements

### 7.1 Book Creation

Logged-in users can create a book.

A book has:

- Name.
- Currency fixed to EUR.
- Creator.
- Invite code.
- Invite link.
- Members.
- Expenses.
- Settlement records.
- Created time.
- Updated time.

The creator becomes a book admin.

### 7.2 Book List

Users can view all books they belong to.

The list should show:

- Book name.
- User role.
- Member count.
- Total recorded expense amount for the book.

Future improvement:

- Add a current balance summary for the logged-in user after the MVP balance UI stabilizes.

### 7.3 Joining A Book

Users can join a book by:

- Opening an invite link.
- Entering an invite code.

If claimable placeholder members exist, the join page must require the joining user to choose one of:

- Join as myself.
- Claim one available placeholder member.

If the user enters an invite code manually and claim options exist, the app should first load the invite context and show the required choice before submitting the join.

Invite rule:

- Invite links and invite codes do not expire by time in MVP.
- Admin can regenerate the invite link/code.
- Regenerating invalidates the previous invite link/code.

## 8. Member And Permission Requirements

### 8.1 Member Types

The system supports:

- Real user member.
- Placeholder member.

### 8.2 Roles

MVP roles:

- Admin.
- Member.

### 8.3 Permission Matrix

| Action | Admin | Member | Placeholder |
| --- | --- | --- | --- |
| View book | Yes | Yes | No |
| Edit book settings | Yes | No | No |
| Regenerate invite code/link | Yes | No | No |
| Add expense | Yes | Yes | No |
| Edit any expense | Yes | Yes | No |
| Delete own expense | Yes | Yes | No |
| Delete others' expenses | Yes | No | No |
| Create placeholder member | Yes | Yes | No |
| Rename placeholder member | Yes | No | No |
| Delete unused placeholder member | Yes | No | No |
| Claim placeholder member | Yes, for self | Yes, for self | No |
| Confirm settlement involving self | Yes | Yes | No |
| Confirm any settlement | Yes | No | No |

## 9. Placeholder Member Requirements

### 9.1 Purpose

Placeholder members allow users to record expenses before all real participants have joined a book.

Example:

- Alice creates a travel book.
- Bob has not joined yet.
- Alice creates a placeholder member named Bob.
- Alice records expenses involving Bob.
- Bob joins later and claims the placeholder member.

### 9.2 Creation

Any real book member can create a placeholder member while adding or editing an expense.

A placeholder member has:

- Display name.
- Book ID.
- No login account.
- No action permissions.
- Optional linked user ID after claim.

### 9.3 Claiming

When a real user joins a book, the system should allow them to claim an existing placeholder member.

Rules:

- Claiming does not require admin approval in MVP.
- A placeholder member can be linked to only one real user.
- Only the current logged-in user can claim a placeholder for themself.
- Admin cannot force-assign a placeholder to another user.
- During invite join, claiming a placeholder should convert that existing member record into the real user's member record instead of creating a duplicate member.
- A user who joins as themself can later claim an available placeholder from the members page.
- A user who is already a real book member can still claim an available placeholder; the placeholder's payer references and participant split records are merged into the user's existing member record.
- If the placeholder and the real member are both participants in the same expense, their owed amounts are combined into the real member's participant split.
- A placeholder that has participated in a confirmed settlement cannot be claimed in MVP.
- Claiming must preserve all historical expenses, balances, and settlements.
- Claiming must not reset that member's balance to zero.
- Claiming is irreversible and must show a confirmation dialog before submitting.

Admin can still rename or manage placeholder members for cleanup.

### 9.4 Deletion

Admins can delete unused placeholder members.

Rules:

- Normal members cannot delete placeholder members.
- Placeholder members can be deleted only while they are not linked to a real user.
- Placeholder members cannot be deleted after they have been used as an expense payer, expense participant, settlement payer, or settlement receiver.
- Deletion is intended for cleanup of mistakenly-created placeholder members before they affect financial history.
- Delete controls for used placeholder members should be disabled with a clear explanation instead of failing only after submit.
- Placeholder deletion is irreversible and must show a confirmation dialog before submitting.

## 10. Expense Requirements

### 10.1 Expense Fields

Each expense must include:

- Book ID.
- Title/reason.
- Expense date.
- Amount.
- Currency, fixed to EUR.
- Payer.
- Participants.
- Split method.
- Per-participant split amount.
- Rounding difference, when applicable.
- Creator.
- Last editor.
- Created time.
- Updated time.

### 10.2 Date Rules

- Expense date cannot be in the future.
- Future/scheduled expenses are out of scope.

### 10.3 Payer Rules

- Each expense has exactly one payer.
- Payer can be a real member or a placeholder member.
- Payer does not have to be included as a participant, although the UI should allow including them easily.
- On new expense forms, the default payer should be the logged-in user's member record.

### 10.4 Participant Rules

- Participants can include real members and placeholder members.
- Expense must have at least one participant.
- Participant split amount must be greater than zero.

### 10.5 Split Methods

MVP supports:

- Equal split.
- Custom amount split.

#### Equal Split

Equal split uses minor currency units, meaning cents for EUR.

Rule:

```text
per_participant_share = ceil(expense_amount_in_cents / participant_count)
split_total = per_participant_share * participant_count
rounding_difference = split_total - expense_amount_in_cents
```

Product decision:

- Round up.
- The receiver may receive slightly more than the original expense total.
- The receiver must not receive less than the original expense total.
- The rounding difference must be stored or derivable for auditability.

Implementation note:

- For equal split, the payer's credit should use `split_total`, not the original expense amount, otherwise the balance ledger will not sum to zero.

#### Custom Amount Split

Rules:

- Custom split amounts are entered in cents or converted safely to cents.
- Custom split total must exactly equal the expense total.
- If the custom split total does not equal the expense total, the expense cannot be saved.
- If custom split validation fails, the form should preserve the user's submitted values so they can adjust the split without re-entering the whole expense.

### 10.6 Editing And Deletion

- Any real book member can edit any expense in the book.
- Normal members can delete only expenses they created.
- Admins can delete any expense.
- Placeholder members cannot edit or delete anything.
- Expenses created before or at the time of the latest confirmed settlement are locked.
- Locked expenses cannot be edited or deleted by any member, including admins.
- The UI should show disabled edit/delete controls with a clear explanation for locked expenses.
- Backend validation must reject edits and deletes for locked expenses.
- Expense deletion is irreversible and must show a confirmation dialog before submitting.

### 10.7 Expense Display

- Expense history should show both the spent date and the added date.
- Expense sorting should continue to use expense date, with later expense dates shown first.
- The book overview latest activity list should expose enough date context to distinguish when an expense happened from when it was recorded or edited.
- When an expense is edited, the latest activity list should show who edited it and when.

## 11. Balance Calculation

### 11.1 Currency

- MVP uses EUR only.
- All monetary calculations must use integer cents.
- Floating point arithmetic must not be used for persisted money calculations.

### 11.2 Expense Ledger Effect

For each expense:

- Each participant is debited by their split amount.
- The payer is credited by the total of participant split amounts.

For custom split:

```text
payer_credit = expense_amount_in_cents
```

For equal split:

```text
payer_credit = split_total
```

### 11.3 Settlement Ledger Effect

For each confirmed settlement:

- Settlement payer is credited by the settlement amount because their debt has been reduced.
- Settlement receiver is debited by the settlement amount because their receivable has been reduced.

### 11.4 Net Balance Formula

For each member in a book:

```text
net_balance =
  expense_credits
  - expense_debits
  + settlement_payments_made
  - settlement_payments_received
```

Interpretation:

- Positive balance means this member should receive money.
- Negative balance means this member should pay money.
- Zero means this member is settled.

The sum of all member balances in a book must be zero after every valid calculation.

## 12. Settlement Requirements

### 12.1 Settlement Mode

MVP uses Settlement Mode B:

- Each person has at most one outgoing payment in the recommended settlement path.

The UI should describe this as:

- Recommended settlement path.

The UI should avoid describing it as:

- Exact original debt relationship.

Reason:

- The path may include intermediate forwarding payments to reduce each person's outgoing payment count.

### 12.2 Settlement Path Algorithm

Input:

- All book members with non-zero net balances.

Preparation:

- Ignore zero-balance members.
- Sort remaining members by net balance ascending.
- The sum of balances must be zero.

Algorithm:

```text
running_balance = 0
for each member except the last member in sorted order:
  running_balance += member.net_balance
  if running_balance < 0:
    create settlement:
      from = current member
      to = next member
      amount = abs(running_balance)
```

Result:

- Each member has at most one outgoing settlement.
- Some net-positive members may receive money and then forward part of it.
- The generated path clears all balances if every settlement is confirmed.

Example:

```text
A = -100
B = +60
C = +40

Sorted: A -100, C +40, B +60

Recommended path:
A pays C 100
C pays B 60
```

Final effect:

- A paid 100.
- C received 100 and paid 60, net received 40.
- B received 60.

### 12.3 Settlement Confirmation

A recommended settlement can be confirmed by:

- The settlement payer.
- The settlement receiver.
- A book admin.

Other unrelated members cannot confirm the settlement.

### 12.4 Settlement Status

MVP has no pending settlement state.

When an eligible user confirms a settlement:

- The system immediately creates a confirmed settlement record.
- The settlement is included in future balance calculations.
- The settlement cannot be revoked in MVP.
- The UI must show a confirmation dialog before creating the settlement, because MVP has no reversal flow.
- Expenses that already existed when the settlement was confirmed become locked against future edit/delete actions.

### 12.5 Settlement History

Settlement history should show:

- Payer.
- Receiver.
- Amount.
- Confirming user.
- Confirmed time.

## 13. Page Requirements

### 13.1 Auth Pages

Pages:

- Register.
- Login.
- Forgot password.
- Reset password.

Requirements:

- Register supports email, password, and optional display name.
- Successful registration sends a welcome email.
- Forgot password sends a reset email.
- Reset password validates token expiry and single-use behavior.

### 13.2 Book List Page

Requirements:

- Show all books for the logged-in user.
- Create a new book.
- Join a book by invite code.
- Open a book.

### 13.3 Book Overview Page

Requirements:

- Show member balances.
- Show recommended settlement path.
- Show confirm settlement action to eligible users.
- Show settlement history.
- Show total consumed ranking.
- Show quick action to add expense.
- Show recent expenses.
- Show member preview.

### 13.4 Expenses Page

Requirements:

- Show expense list.
- Add expense.
- Edit expense.
- Delete expense according to permission rules.
- Filter or sort by date if simple to include.
- On mobile, show the add expense form before expense history.
- On desktop, keep the existing two-column layout with expense history and form side by side.

### 13.5 Expense Form

Requirements:

- Enter title/reason.
- Select date.
- Enter amount in EUR.
- Select payer.
- Select participants.
- Add placeholder member if needed.
- Choose equal split or custom amount split.
- Validate split rules before save.
- Preserve submitted values after validation errors.

### 13.6 Members Page

Requirements:

- Show real members.
- Show placeholder members.
- Show invite code/link.
- Allow admin to regenerate invite code/link.
- Allow eligible user to claim a placeholder member.
- Allow admin to rename placeholder members.
- Allow admin to delete unused placeholder members.

### 13.7 Settlements Page

Requirements:

- Show current recommended settlement path.
- Show confirm action only to eligible users.
- Show settlement history.

### 13.8 Consumption Statistics

Book overview should show a ranked per-member consumption summary.

Definition:

- Consumption total means the sum of amounts a member participated in and owed across all expenses.
- Consumption total is based on `ExpenseParticipant.owedAmountCents`.
- Consumption total is not the same as the amount a member paid at checkout.

Rules:

- Include real members and placeholder members.
- Include members with zero consumption.
- Sort by total consumed amount descending.
- If multiple members have the same total consumed amount, they share the same rank.
- The next rank should skip by position, for example `#1`, `#1`, `#3`.
- Tied members should have stable ordering by display name.

## 14. API Requirements

Exact route names can follow the chosen framework, but the MVP backend should support these capabilities.

### 14.1 Auth

- Register.
- Login.
- Logout.
- Get current user.
- Request password reset.
- Reset password.

### 14.2 Books

- Create book.
- List my books.
- Get book details.
- Update book settings.
- Join by invite code/link.
- Regenerate invite code/link.

### 14.3 Members

- List book members.
- Create placeholder member.
- Rename placeholder member.
- Delete unused placeholder member.
- Claim placeholder member.

### 14.4 Expenses

- List expenses.
- Create expense.
- Update expense.
- Delete expense.

### 14.5 Balances And Settlements

- Get current balances.
- Get recommended settlement path.
- Confirm settlement.
- List settlement history.

## 15. Data Model Requirements

The exact schema can be adapted during implementation, but the core entities should include:

### 15.1 User

- ID.
- Email.
- Password hash.
- Display name.
- Created time.
- Updated time.

### 15.2 Book

- ID.
- Name.
- Currency, fixed to EUR.
- Created by user ID.
- Current invite code.
- Created time.
- Updated time.

### 15.3 Book Member

- ID.
- Book ID.
- User ID, nullable for placeholder members.
- Display name.
- Member type: real or placeholder.
- Role: admin or member.
- Created time.
- Updated time.

### 15.4 Expense

- ID.
- Book ID.
- Title/reason.
- Expense date.
- Amount cents.
- Currency.
- Payer member ID.
- Split method.
- Split total cents.
- Rounding difference cents.
- Created by user ID.
- Updated by user ID, nullable for older records.
- Created time.
- Updated time.

### 15.5 Expense Participant

- ID.
- Expense ID.
- Member ID.
- Owed amount cents.

### 15.6 Settlement

- ID.
- Book ID.
- Payer member ID.
- Receiver member ID.
- Amount cents.
- Confirmed by user ID.
- Confirmed time.
- Created time.

### 15.7 Password Reset Token

- ID.
- User ID.
- Token hash.
- Expires at.
- Used at.
- Created time.

## 16. Validation Requirements

- Email must be syntactically valid.
- Password must meet minimum security requirements.
- Book name cannot be empty.
- Expense title cannot be empty.
- Expense amount must be greater than zero.
- Expense date cannot be in the future.
- Expense must have one payer.
- Expense must have at least one participant.
- Participant owed amount must be greater than zero.
- Custom split total must exactly equal expense amount.
- Equal split must round up to cents.
- Non-members cannot access book data.
- Placeholder members cannot authenticate or perform actions.
- Placeholder claim must enforce current-user-only ownership.
- Placeholder claim must reject placeholders that participated in confirmed settlements.
- Confirm settlement must enforce payer/receiver/admin permission.
- Confirmed settlements cannot be revoked.

## 17. Acceptance Criteria

### 17.1 Authentication

- A new user can register and immediately access the app.
- A welcome email is sent after registration.
- A user can log in with email and password.
- A user can reset a forgotten password through email.

### 17.2 Books

- A user can create multiple books.
- A user can join a book by invite code/link.
- Admin can regenerate invite code/link and old invite access stops working.

### 17.3 Placeholder Members

- A member can create a placeholder member while recording an expense.
- Placeholder member appears in expenses, balances, and settlement paths.
- Admin can delete an unused placeholder member.
- Admin cannot delete a placeholder member after it has been used in financial records.
- Admin can rename an unclaimed placeholder member.
- A real user can claim a placeholder member without admin approval.
- A real user can claim an available placeholder during invite join.
- A real user can claim an available placeholder later from the members page.
- Placeholder claim merges payer references and participant split records into the current user's member record.
- Placeholder claim is blocked if the placeholder participated in a confirmed settlement.
- Historical balances survive the claim.

### 17.4 Expenses

- A member can create an equal split expense.
- A member can create a custom split expense.
- Equal split rounds up.
- Custom split rejects totals that do not equal the expense amount.
- Custom split validation preserves the submitted form values.
- New expenses default the payer to the logged-in member.
- Expense history shows both spent date and added date.
- Expense edits are recorded with the last editing user and appear in latest activity.
- Any member can edit any expense.
- Normal members can delete their own expenses only.
- Admin can delete any expense.
- Delete expense action shows a confirmation prompt.
- Expenses that existed before a confirmed settlement cannot be edited or deleted.

### 17.5 Balances

- Balances use EUR cents.
- Balance sum is zero for a valid book.
- Confirmed settlements affect future balances.
- Historical expenses are not deleted or mutated by settlement confirmation.

### 17.6 Settlements

- Recommended settlement path gives each member at most one outgoing payment.
- Payer can confirm their settlement.
- Receiver can confirm their settlement.
- Admin can confirm any settlement.
- Unrelated members cannot confirm a settlement.
- Confirmed settlements cannot be revoked.

## 18. MVP Test Plan

Minimum test scenarios:

1. Register user and confirm welcome email in local email catcher.
2. Reset password through local email catcher.
3. Create a book and invite another user.
4. Join book through invite code/link.
5. Create expense with equal split and verify round-up behavior.
6. Create expense with custom split and verify exact total validation.
7. Create placeholder member and use it in an expense.
8. Claim placeholder member and verify historical balances are preserved.
9. Rename an unclaimed placeholder member as admin.
10. Claim placeholder during invite join and verify no duplicate member is created.
11. Claim placeholder later from the members page and verify same-expense participant splits are merged.
12. Verify placeholder claim is blocked after confirmed settlement participation.
13. Delete an unused placeholder member as admin.
14. Verify a normal member cannot delete a placeholder member.
15. Verify used placeholder members cannot be deleted.
16. Verify member can edit another member's expense.
17. Verify member cannot delete another member's expense.
18. Verify admin can delete any expense.
19. Verify delete actions require confirmation.
20. Verify custom split validation preserves submitted values after an error.
21. Verify expense edits record the last editing user and surface in latest activity.
22. Verify balance calculation after multiple expenses.
23. Verify recommended settlement path gives each member at most one outgoing payment.
24. Confirm a settlement as payer.
25. Confirm a settlement as receiver.
26. Confirm a settlement as admin.
27. Verify unrelated member cannot confirm a settlement.
28. Verify confirmed settlement changes future balances.
29. Verify confirmed settlement cannot be revoked.
30. Verify expenses that existed before settlement confirmation are locked.
31. Regenerate invite code/link and verify old invite no longer works.

## 19. Implementation Notes

- Store and calculate money in integer cents.
- Keep expense history and settlement history auditable.
- Prefer creating records over mutating financial history.
- Keep email sending behind a provider abstraction.
- Use SMTP-compatible config for local email delivery and an HTTPS API provider such as Resend for production email delivery.
- UI should use "recommended settlement path" wording.
- Internal naming can use `placeholder member`; Chinese UI can use "临时成员" or "待加入成员".
