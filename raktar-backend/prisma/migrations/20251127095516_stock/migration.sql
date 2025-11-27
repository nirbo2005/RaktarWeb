-- CreateTable
CREATE TABLE `Stock` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nev` VARCHAR(191) NOT NULL,
    `gyarto` VARCHAR(191) NOT NULL,
    `lejarat` DATETIME(3) NOT NULL,
    `ar` INTEGER NOT NULL,
    `mennyiseg` INTEGER NOT NULL,
    `parcella` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
