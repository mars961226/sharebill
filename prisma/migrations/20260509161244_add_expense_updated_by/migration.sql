-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "expenseDate" DATETIME NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "payerMemberId" TEXT NOT NULL,
    "splitMethod" TEXT NOT NULL,
    "splitTotalCents" INTEGER NOT NULL,
    "roundingDifferenceCents" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expense_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Expense_payerMemberId_fkey" FOREIGN KEY ("payerMemberId") REFERENCES "BookMember" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Expense_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Expense" ("amountCents", "bookId", "createdAt", "createdById", "currency", "expenseDate", "id", "payerMemberId", "roundingDifferenceCents", "splitMethod", "splitTotalCents", "title", "updatedAt") SELECT "amountCents", "bookId", "createdAt", "createdById", "currency", "expenseDate", "id", "payerMemberId", "roundingDifferenceCents", "splitMethod", "splitTotalCents", "title", "updatedAt" FROM "Expense";
DROP TABLE "Expense";
ALTER TABLE "new_Expense" RENAME TO "Expense";
CREATE INDEX "Expense_bookId_idx" ON "Expense"("bookId");
CREATE INDEX "Expense_payerMemberId_idx" ON "Expense"("payerMemberId");
CREATE INDEX "Expense_createdById_idx" ON "Expense"("createdById");
CREATE INDEX "Expense_updatedById_idx" ON "Expense"("updatedById");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
