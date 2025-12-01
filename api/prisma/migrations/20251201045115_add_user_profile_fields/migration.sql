-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user" (
    "user_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "timezone" TEXT,
    "dietary_tags" TEXT,
    "allergies" TEXT,
    "reminder_window_days" INTEGER DEFAULT 3,
    "notify_email" BOOLEAN DEFAULT true,
    "notify_push" BOOLEAN DEFAULT true,
    "notify_expiring" BOOLEAN DEFAULT true,
    "notify_low_stock" BOOLEAN DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME
);
INSERT INTO "new_user" ("created_at", "dietary_tags", "email", "name", "reminder_window_days", "timezone", "user_id") SELECT "created_at", "dietary_tags", "email", "name", "reminder_window_days", "timezone", "user_id" FROM "user";
DROP TABLE "user";
ALTER TABLE "new_user" RENAME TO "user";
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
