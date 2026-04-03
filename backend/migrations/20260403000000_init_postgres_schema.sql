-- Postgres catch-up schema for environments that have legacy MySQL migrations recorded.
-- This migration is idempotent and ensures core tables exist with columns used by the backend.

DO $$
BEGIN
    CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "ProjectPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "User" (
    id SERIAL PRIMARY KEY,
    email VARCHAR(191) NOT NULL UNIQUE,
    password VARCHAR(191) NOT NULL,
    name VARCHAR(191),
    admin BOOLEAN NOT NULL DEFAULT false,
    "notificationToken" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "refreshToken" TEXT,
    "refreshTokenExpiry" TIMESTAMPTZ
);

ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS "notificationToken" TEXT;
ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS "refreshToken" TEXT;
ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS "refreshTokenExpiry" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"(email);

CREATE TABLE IF NOT EXISTS "Room" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(191) NOT NULL UNIQUE,
    icon VARCHAR(191)
);

CREATE TABLE IF NOT EXISTS "Place" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    icon VARCHAR(191),
    "roomId" INTEGER,
    CONSTRAINT "Place_name_roomId_key" UNIQUE (name, "roomId"),
    CONSTRAINT "Place_roomId_fkey"
        FOREIGN KEY ("roomId") REFERENCES "Room"(id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Place_roomId_idx" ON "Place"("roomId");

CREATE TABLE IF NOT EXISTS "Container" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    icon VARCHAR(191),
    "roomId" INTEGER,
    "placeId" INTEGER,
    CONSTRAINT "Container_roomId_fkey"
        FOREIGN KEY ("roomId") REFERENCES "Room"(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Container_placeId_fkey"
        FOREIGN KEY ("placeId") REFERENCES "Place"(id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Container_roomId_idx" ON "Container"("roomId");
CREATE INDEX IF NOT EXISTS "Container_placeId_idx" ON "Container"("placeId");

CREATE TABLE IF NOT EXISTS "Item" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    image VARCHAR(191),
    price DOUBLE PRECISION,
    sellprice DOUBLE PRECISION,
    status VARCHAR(191),
    consumable BOOLEAN NOT NULL DEFAULT false,
    "placeId" INTEGER,
    "roomId" INTEGER,
    "containerId" INTEGER,
    "itemLink" VARCHAR(191),
    "importanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMPTZ,
    CONSTRAINT "Item_placeId_fkey"
        FOREIGN KEY ("placeId") REFERENCES "Place"(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Item_roomId_fkey"
        FOREIGN KEY ("roomId") REFERENCES "Room"(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Item_containerId_fkey"
        FOREIGN KEY ("containerId") REFERENCES "Container"(id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

ALTER TABLE IF EXISTS "Item" ADD COLUMN IF NOT EXISTS "containerId" INTEGER;
ALTER TABLE IF EXISTS "Item" ADD COLUMN IF NOT EXISTS "itemLink" VARCHAR(191);
ALTER TABLE IF EXISTS "Item" ADD COLUMN IF NOT EXISTS "importanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE IF EXISTS "Item" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS "Item_placeId_idx" ON "Item"("placeId");
CREATE INDEX IF NOT EXISTS "Item_roomId_idx" ON "Item"("roomId");
CREATE INDEX IF NOT EXISTS "Item_containerId_idx" ON "Item"("containerId");

CREATE TABLE IF NOT EXISTS "Tag" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(191) NOT NULL UNIQUE,
    icon VARCHAR(191)
);

CREATE TABLE IF NOT EXISTS "ItemTag" (
    id SERIAL PRIMARY KEY,
    "itemId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,
    CONSTRAINT "ItemTag_itemId_tagId_key" UNIQUE ("itemId", "tagId"),
    CONSTRAINT "ItemTag_itemId_fkey"
        FOREIGN KEY ("itemId") REFERENCES "Item"(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ItemTag_tagId_fkey"
        FOREIGN KEY ("tagId") REFERENCES "Tag"(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ItemTag_itemId_idx" ON "ItemTag"("itemId");
CREATE INDEX IF NOT EXISTS "ItemTag_tagId_idx" ON "ItemTag"("tagId");

CREATE TABLE IF NOT EXISTS "Favourite" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    CONSTRAINT "Favourite_userId_itemId_key" UNIQUE ("userId", "itemId"),
    CONSTRAINT "Favourite_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Favourite_itemId_fkey"
        FOREIGN KEY ("itemId") REFERENCES "Item"(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Favourite_userId_idx" ON "Favourite"("userId");
CREATE INDEX IF NOT EXISTS "Favourite_itemId_idx" ON "Favourite"("itemId");

CREATE TABLE IF NOT EXISTS "Alert" (
    id SERIAL PRIMARY KEY,
    "itemId" INTEGER NOT NULL,
    threshold INTEGER NOT NULL,
    name VARCHAR(191),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSent" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "Alert_itemId_threshold_key" UNIQUE ("itemId", threshold),
    CONSTRAINT "Alert_itemId_fkey"
        FOREIGN KEY ("itemId") REFERENCES "Item"(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Alert_itemId_idx" ON "Alert"("itemId");
CREATE INDEX IF NOT EXISTS "Alert_isActive_idx" ON "Alert"("isActive");
CREATE INDEX IF NOT EXISTS "Alert_threshold_idx" ON "Alert"(threshold);

CREATE TABLE IF NOT EXISTS "Project" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    status "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    priority "ProjectPriority" NOT NULL DEFAULT 'MEDIUM',
    "startDate" TIMESTAMPTZ,
    "endDate" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ProjectItem" (
    id SERIAL PRIMARY KEY,
    "projectId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "ProjectItem_projectId_itemId_key" UNIQUE ("projectId", "itemId"),
    CONSTRAINT "ProjectItem_projectId_fkey"
        FOREIGN KEY ("projectId") REFERENCES "Project"(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectItem_itemId_fkey"
        FOREIGN KEY ("itemId") REFERENCES "Item"(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ProjectItem_projectId_idx" ON "ProjectItem"("projectId");
CREATE INDEX IF NOT EXISTS "ProjectItem_itemId_idx" ON "ProjectItem"("itemId");

CREATE TABLE IF NOT EXISTS "UserPreferences" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL UNIQUE,
    "showWelcomeHeader" BOOLEAN NOT NULL DEFAULT true,
    "showStatsCards" BOOLEAN NOT NULL DEFAULT true,
    "showRecentItems" BOOLEAN NOT NULL DEFAULT true,
    "showRoomDistribution" BOOLEAN NOT NULL DEFAULT true,
    "showAlertsPerMonth" BOOLEAN NOT NULL DEFAULT true,
    "showInventoryValue" BOOLEAN NOT NULL DEFAULT true,
    "showStatusDistribution" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "UserPreferences_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);
