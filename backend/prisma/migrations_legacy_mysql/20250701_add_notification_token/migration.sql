-- Add notification token field to User table
ALTER TABLE `User` ADD COLUMN `notificationToken` VARCHAR(191) NULL;
