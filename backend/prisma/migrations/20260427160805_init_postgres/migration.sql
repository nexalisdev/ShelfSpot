-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProjectPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(191) NOT NULL,
    "password" VARCHAR(191) NOT NULL,
    "name" VARCHAR(191),
    "admin" BOOLEAN NOT NULL DEFAULT false,
    "notificationToken" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refreshToken" TEXT,
    "refreshTokenExpiry" TIMESTAMPTZ(6),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "showWelcomeHeader" BOOLEAN NOT NULL DEFAULT true,
    "showStatsCards" BOOLEAN NOT NULL DEFAULT true,
    "showRecentItems" BOOLEAN NOT NULL DEFAULT true,
    "showRoomDistribution" BOOLEAN NOT NULL DEFAULT true,
    "showAlertsPerMonth" BOOLEAN NOT NULL DEFAULT true,
    "showInventoryValue" BOOLEAN NOT NULL DEFAULT true,
    "showStatusDistribution" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "image" VARCHAR(191),
    "price" DOUBLE PRECISION,
    "sellprice" DOUBLE PRECISION,
    "status" VARCHAR(191),
    "consumable" BOOLEAN NOT NULL DEFAULT false,
    "placeId" INTEGER,
    "roomId" INTEGER,
    "containerId" INTEGER,
    "itemLink" VARCHAR(191),
    "importanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Place" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "icon" VARCHAR(191),
    "roomId" INTEGER,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "icon" VARCHAR(191),

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "icon" VARCHAR(191),

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemTag" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "ItemTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favourite" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,

    CONSTRAINT "Favourite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Container" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "icon" VARCHAR(191),
    "roomId" INTEGER,
    "placeId" INTEGER,

    CONSTRAINT "Container_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "threshold" INTEGER NOT NULL,
    "name" VARCHAR(191),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSent" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "priority" "ProjectPriority" NOT NULL DEFAULT 'MEDIUM',
    "startDate" TIMESTAMPTZ(6),
    "endDate" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectItem" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_sqlx_migrations" (
    "version" BIGINT NOT NULL,
    "description" TEXT NOT NULL,
    "installed_on" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,
    "checksum" BYTEA NOT NULL,
    "execution_time" BIGINT NOT NULL,

    CONSTRAINT "_sqlx_migrations_pkey" PRIMARY KEY ("version")
);

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "Item_placeId_idx" ON "Item"("placeId");

-- CreateIndex
CREATE INDEX "Item_roomId_idx" ON "Item"("roomId");

-- CreateIndex
CREATE INDEX "Item_containerId_idx" ON "Item"("containerId");

-- CreateIndex
CREATE INDEX "Place_roomId_idx" ON "Place"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "Place_name_roomId_key" ON "Place"("name", "roomId");

-- CreateIndex
CREATE UNIQUE INDEX "Room_name_key" ON "Room"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "ItemTag_tagId_idx" ON "ItemTag"("tagId");

-- CreateIndex
CREATE INDEX "ItemTag_itemId_idx" ON "ItemTag"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemTag_itemId_tagId_key" ON "ItemTag"("itemId", "tagId");

-- CreateIndex
CREATE INDEX "Favourite_userId_idx" ON "Favourite"("userId");

-- CreateIndex
CREATE INDEX "Favourite_itemId_idx" ON "Favourite"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "Favourite_userId_itemId_key" ON "Favourite"("userId", "itemId");

-- CreateIndex
CREATE INDEX "Container_roomId_idx" ON "Container"("roomId");

-- CreateIndex
CREATE INDEX "Container_placeId_idx" ON "Container"("placeId");

-- CreateIndex
CREATE INDEX "Alert_itemId_idx" ON "Alert"("itemId");

-- CreateIndex
CREATE INDEX "Alert_isActive_idx" ON "Alert"("isActive");

-- CreateIndex
CREATE INDEX "Alert_threshold_idx" ON "Alert"("threshold");

-- CreateIndex
CREATE UNIQUE INDEX "Alert_itemId_threshold_key" ON "Alert"("itemId", "threshold");

-- CreateIndex
CREATE INDEX "ProjectItem_projectId_idx" ON "ProjectItem"("projectId");

-- CreateIndex
CREATE INDEX "ProjectItem_itemId_idx" ON "ProjectItem"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectItem_projectId_itemId_key" ON "ProjectItem"("projectId", "itemId");

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemTag" ADD CONSTRAINT "ItemTag_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemTag" ADD CONSTRAINT "ItemTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favourite" ADD CONSTRAINT "Favourite_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favourite" ADD CONSTRAINT "Favourite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Container" ADD CONSTRAINT "Container_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Container" ADD CONSTRAINT "Container_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectItem" ADD CONSTRAINT "ProjectItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectItem" ADD CONSTRAINT "ProjectItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
