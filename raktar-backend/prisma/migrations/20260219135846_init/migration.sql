-- CreateTable
CREATE TABLE `Stock` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nev` VARCHAR(191) NOT NULL,
    `gyarto` VARCHAR(191) NOT NULL,
    `lejarat` DATETIME(3) NOT NULL,
    `ar` INTEGER NOT NULL,
    `mennyiseg` INTEGER NOT NULL,
    `parcella` VARCHAR(191) NOT NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nev` VARCHAR(191) NOT NULL,
    `felhasznalonev` VARCHAR(191) NOT NULL,
    `jelszo` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `telefonszam` VARCHAR(191) NULL,
    `rang` ENUM('NEZELODO', 'KEZELO', 'ADMIN') NOT NULL DEFAULT 'NEZELODO',
    `isBanned` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `User_felhasznalonev_key`(`felhasznalonev`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `idopont` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `muvelet` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `stockId` INTEGER NULL,
    `regiAdat` JSON NULL,
    `ujAdat` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChangeRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `tipus` VARCHAR(191) NOT NULL,
    `ujErtek` VARCHAR(191) NOT NULL,
    `statusz` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `letrehozva` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_stockId_fkey` FOREIGN KEY (`stockId`) REFERENCES `Stock`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChangeRequest` ADD CONSTRAINT `ChangeRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
