/*
  Warnings:

  - You are about to drop the column `itemId` on the `Container` table. All the data in the column will be lost.
  - You are about to drop the `_ContainerToItems` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Container` DROP FOREIGN KEY `Container_itemId_fkey`;

-- DropForeignKey
ALTER TABLE `_ContainerToItems` DROP FOREIGN KEY `_ContainerToItems_A_fkey`;

-- DropForeignKey
ALTER TABLE `_ContainerToItems` DROP FOREIGN KEY `_ContainerToItems_B_fkey`;

-- DropIndex
DROP INDEX `Container_itemId_key` ON `Container`;

-- AlterTable
ALTER TABLE `Container` DROP COLUMN `itemId`;

-- AlterTable
ALTER TABLE `Item` ADD COLUMN `containerId` INTEGER NULL;

-- DropTable
DROP TABLE `_ContainerToItems`;

-- AddForeignKey
ALTER TABLE `Item` ADD CONSTRAINT `Item_containerId_fkey` FOREIGN KEY (`containerId`) REFERENCES `Container`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
