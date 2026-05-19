-- CreateTable
CREATE TABLE `UserPreferences` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `showWelcomeHeader` BOOLEAN NOT NULL DEFAULT true,
    `showStatsCards` BOOLEAN NOT NULL DEFAULT true,
    `showRecentItems` BOOLEAN NOT NULL DEFAULT true,
    `showRoomDistribution` BOOLEAN NOT NULL DEFAULT true,
    `showAlertsPerMonth` BOOLEAN NOT NULL DEFAULT true,
    `showInventoryValue` BOOLEAN NOT NULL DEFAULT true,
    `showStatusDistribution` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `UserPreferences_userId_key`(`userId`),
    INDEX `UserPreferences_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserPreferences` ADD CONSTRAINT `UserPreferences_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
