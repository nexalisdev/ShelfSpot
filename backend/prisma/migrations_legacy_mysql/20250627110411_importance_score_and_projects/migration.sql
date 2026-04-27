-- AlterTable
ALTER TABLE `Item` ADD COLUMN `importanceScore` DOUBLE NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `Project` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Project_name_key`(`name`),
    INDEX `Project_status_idx`(`status`),
    INDEX `Project_priority_idx`(`priority`),
    INDEX `Project_startDate_idx`(`startDate`),
    INDEX `Project_endDate_idx`(`endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER NOT NULL,
    `itemId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProjectItem_projectId_idx`(`projectId`),
    INDEX `ProjectItem_itemId_idx`(`itemId`),
    INDEX `ProjectItem_isActive_idx`(`isActive`),
    UNIQUE INDEX `ProjectItem_projectId_itemId_key`(`projectId`, `itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Item_importanceScore_idx` ON `Item`(`importanceScore`);

-- AddForeignKey
ALTER TABLE `ProjectItem` ADD CONSTRAINT `ProjectItem_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectItem` ADD CONSTRAINT `ProjectItem_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
