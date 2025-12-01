-- CreateTable
CREATE TABLE "user" (
    "user_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "timezone" TEXT,
    "dietary_tags" TEXT,
    "reminder_window_days" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "pantry_item" (
    "pantry_item_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" REAL,
    "unit" TEXT,
    "category" TEXT,
    "expiration_date" DATETIME,
    "source" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pantry_item_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "grocery_list" (
    "grocery_list_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "grocery_list_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "grocery_list_item" (
    "grocery_list_item_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "grocery_list_id" INTEGER NOT NULL,
    "pantry_item_id" INTEGER,
    "name" TEXT NOT NULL,
    "quantity" REAL,
    "unit" TEXT,
    "category" TEXT,
    "note" TEXT,
    "is_checked" BOOLEAN DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "grocery_list_item_grocery_list_id_fkey" FOREIGN KEY ("grocery_list_id") REFERENCES "grocery_list" ("grocery_list_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "grocery_list_item_pantry_item_id_fkey" FOREIGN KEY ("pantry_item_id") REFERENCES "pantry_item" ("pantry_item_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "meal_idea" (
    "meal_idea_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "meal_idea_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notification" (
    "notification_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pantry_item_id" INTEGER NOT NULL,
    "scheduled_for" DATETIME,
    "sent_at" DATETIME,
    "status" TEXT,
    CONSTRAINT "notification_pantry_item_id_fkey" FOREIGN KEY ("pantry_item_id") REFERENCES "pantry_item" ("pantry_item_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
