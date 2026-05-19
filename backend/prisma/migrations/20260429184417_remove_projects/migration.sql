/*
  Warnings:

  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProjectItem" DROP CONSTRAINT "ProjectItem_itemId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectItem" DROP CONSTRAINT "ProjectItem_projectId_fkey";

-- DropTable
DROP TABLE "Project";

-- DropTable
DROP TABLE "ProjectItem";

-- DropEnum
DROP TYPE "ProjectPriority";

-- DropEnum
DROP TYPE "ProjectStatus";
