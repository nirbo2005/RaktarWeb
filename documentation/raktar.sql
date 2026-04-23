-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1
-- Létrehozás ideje: 2026. Ápr 23. 21:40
-- Kiszolgáló verziója: 10.4.32-MariaDB
-- PHP verzió: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Adatbázis: `raktar`
--

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `auditlog`
--

CREATE TABLE `auditlog` (
  `id` int(11) NOT NULL,
  `idopont` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `muvelet` varchar(191) NOT NULL,
  `userId` int(11) NOT NULL,
  `productId` int(11) DEFAULT NULL,
  `regiAdat` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`regiAdat`)),
  `ujAdat` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`ujAdat`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `auditlog`
--

INSERT INTO `auditlog` (`id`, `idopont`, `muvelet`, `userId`, `productId`, `regiAdat`, `ujAdat`) VALUES
(1, '2026-04-23 07:02:30.114', 'PRODUCT_DELETE', 1, 19, '{\"id\":19,\"nev\":\"Ablaktisztító szórófejes (Clin)\",\"gyarto\":\"Henkel\",\"kategoria\":\"VEGYSZER\",\"beszerzesiAr\":600,\"eladasiAr\":1100,\"suly\":0.6,\"minimumKeszlet\":40,\"isDeleted\":false,\"letrehozva\":\"2026-04-23T06:48:20.997Z\"}', '{\"id\":19,\"nev\":\"Ablaktisztító szórófejes (Clin)\",\"gyarto\":\"Henkel\",\"kategoria\":\"VEGYSZER\",\"beszerzesiAr\":600,\"eladasiAr\":1100,\"suly\":0.6,\"minimumKeszlet\":40,\"isDeleted\":true,\"letrehozva\":\"2026-04-23T06:48:20.997Z\"}'),
(2, '2026-04-23 07:03:07.906', 'BATCH_DELETE', 4, 27, '{\"id\":51,\"productId\":27,\"parcella\":\"A4-2\",\"mennyiseg\":150,\"lejarat\":null,\"bekerules\":\"2026-04-23T06:48:21.065Z\"}', 'null'),
(3, '2026-04-23 07:03:09.667', 'PRODUCT_DELETE', 4, 27, '{\"id\":27,\"nev\":\"Golyóstoll Kék (Bic)\",\"gyarto\":\"Bic\",\"kategoria\":\"IRODASZER\",\"beszerzesiAr\":50,\"eladasiAr\":120,\"suly\":0.01,\"minimumKeszlet\":500,\"isDeleted\":false,\"letrehozva\":\"2026-04-23T06:48:21.062Z\"}', '{\"id\":27,\"nev\":\"Golyóstoll Kék (Bic)\",\"gyarto\":\"Bic\",\"kategoria\":\"IRODASZER\",\"beszerzesiAr\":50,\"eladasiAr\":120,\"suly\":0.01,\"minimumKeszlet\":500,\"isDeleted\":true,\"letrehozva\":\"2026-04-23T06:48:21.062Z\"}'),
(4, '2026-04-23 07:03:48.719', 'BATCH_UPDATE', 4, 13, '{\"id\":24,\"productId\":13,\"parcella\":\"B3-1\",\"mennyiseg\":22,\"lejarat\":null,\"bekerules\":\"2026-04-23T06:48:20.963Z\",\"product\":{\"id\":13,\"nev\":\"A Gyűrűk Ura 1. (Európa)\",\"gyarto\":\"Európa Kiadó\",\"kategoria\":\"KONYVEK\",\"beszerzesiAr\":2500,\"eladasiAr\":4500,\"suly\":0.8,\"minimumKeszlet\":15,\"isDeleted\":false,\"letrehozva\":\"2026-04-23T06:48:20.960Z\"}}', '{\"id\":24,\"productId\":13,\"parcella\":\"B3-1\",\"mennyiseg\":32,\"lejarat\":null,\"bekerules\":\"2026-04-23T06:48:20.963Z\"}'),
(5, '2026-04-23 07:16:21.960', 'BATCH_CREATE', 4, 2, 'null', '{\"id\":63,\"productId\":2,\"parcella\":\"A1-1\",\"mennyiseg\":10,\"lejarat\":\"2027-02-23T00:00:00.000Z\",\"bekerules\":\"2026-04-23T07:16:21.957Z\"}'),
(6, '2026-04-23 07:17:20.820', 'PRODUCT_DELETE', 4, 13, '{\"id\":13,\"nev\":\"A Gyűrűk Ura 1. (Európa)\",\"gyarto\":\"Európa Kiadó\",\"kategoria\":\"KONYVEK\",\"beszerzesiAr\":2500,\"eladasiAr\":4500,\"suly\":0.8,\"minimumKeszlet\":15,\"isDeleted\":false,\"letrehozva\":\"2026-04-23T06:48:20.960Z\"}', '{\"id\":13,\"nev\":\"A Gyűrűk Ura 1. (Európa)\",\"gyarto\":\"Európa Kiadó\",\"kategoria\":\"KONYVEK\",\"beszerzesiAr\":2500,\"eladasiAr\":4500,\"suly\":0.8,\"minimumKeszlet\":15,\"isDeleted\":true,\"letrehozva\":\"2026-04-23T06:48:20.960Z\"}'),
(7, '2026-04-23 19:38:02.145', 'BATCH_DELETE', 1, 8, '{\"id\":13,\"productId\":8,\"parcella\":\"A2-2\",\"mennyiseg\":2,\"lejarat\":null,\"bekerules\":\"2026-04-23T06:48:20.939Z\"}', 'null');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `batch`
--

CREATE TABLE `batch` (
  `id` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `parcella` varchar(191) NOT NULL,
  `mennyiseg` int(11) NOT NULL,
  `lejarat` datetime(3) DEFAULT NULL,
  `bekerules` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `batch`
--

INSERT INTO `batch` (`id`, `productId`, `parcella`, `mennyiseg`, `lejarat`, `bekerules`) VALUES
(1, 1, 'A1-1', 10, NULL, '2026-04-23 06:48:20.910'),
(2, 1, 'A1-2', 25, NULL, '2026-04-23 06:48:20.910'),
(3, 1, 'A1-3', 5, NULL, '2026-04-23 06:48:20.910'),
(4, 2, 'B1-1', 40, '2026-02-28 00:00:00.000', '2026-04-23 06:48:20.917'),
(5, 3, 'B1-2', 15, '2026-03-04 00:00:00.000', '2026-04-23 06:48:20.921'),
(6, 3, 'B1-3', 20, '2026-03-04 00:00:00.000', '2026-04-23 06:48:20.921'),
(7, 4, 'C1-1', 40, '2028-01-01 00:00:00.000', '2026-04-23 06:48:20.926'),
(8, 4, 'C1-2', 40, '2028-01-01 00:00:00.000', '2026-04-23 06:48:20.926'),
(9, 4, 'C1-3', 40, '2028-05-10 00:00:00.000', '2026-04-23 06:48:20.926'),
(10, 4, 'C1-4', 25, '2028-05-10 00:00:00.000', '2026-04-23 06:48:20.926'),
(11, 6, 'D1-1', 150, '2029-10-01 00:00:00.000', '2026-04-23 06:48:20.932'),
(12, 8, 'A2-1', 4, NULL, '2026-04-23 06:48:20.939'),
(14, 9, 'D2-1', 30, NULL, '2026-04-23 06:48:20.944'),
(15, 9, 'D2-2', 30, NULL, '2026-04-23 06:48:20.944'),
(16, 9, 'D2-3', 30, NULL, '2026-04-23 06:48:20.944'),
(17, 9, 'D2-4', 30, NULL, '2026-04-23 06:48:20.944'),
(18, 9, 'D3-1', 15, NULL, '2026-04-23 06:48:20.944'),
(19, 10, 'B2-1', 12, NULL, '2026-04-23 06:48:20.948'),
(20, 11, 'A3-1', 8, NULL, '2026-04-23 06:48:20.952'),
(21, 11, 'A3-2', 14, NULL, '2026-04-23 06:48:20.952'),
(22, 12, 'C2-1', 45, '2027-05-20 00:00:00.000', '2026-04-23 06:48:20.957'),
(23, 12, 'C2-2', 12, '2026-03-09 00:00:00.000', '2026-04-23 06:48:20.957'),
(24, 13, 'B3-1', 32, NULL, '2026-04-23 06:48:20.963'),
(25, 14, 'D4-1', 8, NULL, '2026-04-23 06:48:20.969'),
(26, 14, 'D4-2', 6, NULL, '2026-04-23 06:48:20.969'),
(27, 15, 'C3-1', 20, '2026-03-01 00:00:00.000', '2026-04-23 06:48:20.974'),
(28, 15, 'C3-2', 100, '2026-11-15 00:00:00.000', '2026-04-23 06:48:20.974'),
(29, 15, 'C3-3', 100, '2027-02-10 00:00:00.000', '2026-04-23 06:48:20.974'),
(30, 16, 'A4-1', 85, NULL, '2026-04-23 06:48:20.978'),
(31, 17, 'B4-1', 5, '2026-03-04 00:00:00.000', '2026-04-23 06:48:20.984'),
(32, 17, 'B4-2', 8, '2026-03-04 00:00:00.000', '2026-04-23 06:48:20.984'),
(33, 19, 'C4-1', 65, '2029-08-20 00:00:00.000', '2026-04-23 06:48:21.004'),
(34, 20, 'D5-1', 25, NULL, '2026-04-23 06:48:21.016'),
(35, 20, 'D5-2', 25, NULL, '2026-04-23 06:48:21.016'),
(36, 20, 'D5-3', 25, NULL, '2026-04-23 06:48:21.016'),
(37, 20, 'D5-4', 12, NULL, '2026-04-23 06:48:21.016'),
(38, 21, 'C5-1', 210, '2026-03-09 00:00:00.000', '2026-04-23 06:48:21.031'),
(39, 22, 'A5-1', 120, NULL, '2026-04-23 06:48:21.039'),
(40, 23, 'B5-1', 10, NULL, '2026-04-23 06:48:21.046'),
(41, 23, 'B5-2', 8, NULL, '2026-04-23 06:48:21.046'),
(42, 25, 'A1-4', 10, NULL, '2026-04-23 06:48:21.054'),
(43, 25, 'B1-4', 10, NULL, '2026-04-23 06:48:21.054'),
(44, 25, 'C1-4', 5, NULL, '2026-04-23 06:48:21.054'),
(45, 26, 'C2-3', 50, '2027-11-01 00:00:00.000', '2026-04-23 06:48:21.060'),
(46, 26, 'C2-4', 50, '2028-02-15 00:00:00.000', '2026-04-23 06:48:21.060'),
(47, 27, 'A2-3', 200, NULL, '2026-04-23 06:48:21.065'),
(48, 27, 'A2-4', 200, NULL, '2026-04-23 06:48:21.065'),
(49, 27, 'A3-3', 200, NULL, '2026-04-23 06:48:21.065'),
(50, 27, 'A3-4', 200, NULL, '2026-04-23 06:48:21.065'),
(52, 28, 'D1-2', 12, '2030-05-10 00:00:00.000', '2026-04-23 06:48:21.069'),
(53, 28, 'D1-3', 15, '2030-05-10 00:00:00.000', '2026-04-23 06:48:21.069'),
(54, 29, 'B2-2', 4, NULL, '2026-04-23 06:48:21.074'),
(55, 31, 'B3-2', 60, '2026-10-10 00:00:00.000', '2026-04-23 06:48:21.081'),
(56, 31, 'B3-3', 40, '2026-10-10 00:00:00.000', '2026-04-23 06:48:21.081'),
(57, 32, 'A4-3', 6, NULL, '2026-04-23 06:48:21.087'),
(58, 34, 'C4-2', 40, '2028-09-01 00:00:00.000', '2026-04-23 06:48:21.094'),
(59, 34, 'C4-3', 50, '2029-01-15 00:00:00.000', '2026-04-23 06:48:21.094'),
(60, 35, 'D3-2', 5, '2026-02-25 00:00:00.000', '2026-04-23 06:48:21.099'),
(61, 35, 'D3-3', 10, '2026-03-04 00:00:00.000', '2026-04-23 06:48:21.099'),
(62, 35, 'D3-4', 30, '2027-08-20 00:00:00.000', '2026-04-23 06:48:21.099'),
(63, 2, 'A1-1', 10, '2027-02-23 00:00:00.000', '2026-04-23 07:16:21.957');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `changerequest`
--

CREATE TABLE `changerequest` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `tipus` varchar(191) NOT NULL,
  `ujErtek` varchar(191) NOT NULL,
  `statusz` varchar(191) NOT NULL DEFAULT 'PENDING',
  `letrehozva` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `notification`
--

CREATE TABLE `notification` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `productId` int(11) DEFAULT NULL,
  `uzenet` varchar(191) NOT NULL,
  `tipus` varchar(191) NOT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `isDeleted` tinyint(1) NOT NULL DEFAULT 0,
  `deletedAt` datetime(3) DEFAULT NULL,
  `letrehozva` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `notification`
--

INSERT INTO `notification` (`id`, `userId`, `productId`, `uzenet`, `tipus`, `isRead`, `isDeleted`, `deletedAt`, `letrehozva`) VALUES
(1, 1, 2, '{\"key\":\"lowStock\",\"data\":{\"nev\":\"Trappista Tej 1.5% (Mizo)\",\"mennyiseg\":40,\"min\":100}}', 'WARNING', 1, 0, NULL, '2026-04-23 06:57:44.776'),
(2, 2, 2, '{\"key\":\"lowStock\",\"data\":{\"nev\":\"Trappista Tej 1.5% (Mizo)\",\"mennyiseg\":40,\"min\":100}}', 'WARNING', 0, 0, NULL, '2026-04-23 06:57:44.776'),
(3, 3, 2, '{\"key\":\"lowStock\",\"data\":{\"nev\":\"Trappista Tej 1.5% (Mizo)\",\"mennyiseg\":40,\"min\":100}}', 'WARNING', 0, 0, NULL, '2026-04-23 06:57:44.776'),
(4, 4, 2, '{\"key\":\"lowStock\",\"data\":{\"nev\":\"Trappista Tej 1.5% (Mizo)\",\"mennyiseg\":40,\"min\":100}}', 'WARNING', 0, 0, NULL, '2026-04-23 06:57:44.776'),
(5, 1, 2, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"Trappista Tej 1.5% (Mizo)\",\"parcella\":\"B1-1\",\"datum\":\"2026. 02. 28.\"}}', 'ERROR', 1, 0, NULL, '2026-04-23 06:57:44.784'),
(6, 2, 2, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"Trappista Tej 1.5% (Mizo)\",\"parcella\":\"B1-1\",\"datum\":\"2026. 02. 28.\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.784'),
(7, 3, 2, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"Trappista Tej 1.5% (Mizo)\",\"parcella\":\"B1-1\",\"datum\":\"2026. 02. 28.\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.784'),
(8, 4, 2, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"Trappista Tej 1.5% (Mizo)\",\"parcella\":\"B1-1\",\"datum\":\"2026. 02. 28.\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.784'),
(9, 1, 3, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"Szeletelt Kenyér (Ceres)\",\"parcella\":\"B1-2\",\"datum\":\"2026. 03. 04.\"}}', 'ERROR', 1, 0, NULL, '2026-04-23 06:57:44.793'),
(10, 2, 3, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"Szeletelt Kenyér (Ceres)\",\"parcella\":\"B1-2\",\"datum\":\"2026. 03. 04.\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.793'),
(11, 3, 3, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"Szeletelt Kenyér (Ceres)\",\"parcella\":\"B1-2\",\"datum\":\"2026. 03. 04.\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.793'),
(12, 4, 3, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"Szeletelt Kenyér (Ceres)\",\"parcella\":\"B1-2\",\"datum\":\"2026. 03. 04.\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.793'),
(13, 1, 5, '{\"key\":\"outOfStock\",\"data\":{\"nev\":\"Fénymásolópapír A4 (Xerox)\"}}', 'ERROR', 1, 0, NULL, '2026-04-23 06:57:44.813'),
(14, 2, 5, '{\"key\":\"outOfStock\",\"data\":{\"nev\":\"Fénymásolópapír A4 (Xerox)\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.813'),
(15, 3, 5, '{\"key\":\"outOfStock\",\"data\":{\"nev\":\"Fénymásolópapír A4 (Xerox)\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.813'),
(16, 4, 5, '{\"key\":\"outOfStock\",\"data\":{\"nev\":\"Fénymásolópapír A4 (Xerox)\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.813'),
(17, 1, 7, '{\"key\":\"outOfStock\",\"data\":{\"nev\":\"Férfi Póló L-es (Nike)\"}}', 'ERROR', 1, 0, NULL, '2026-04-23 06:57:44.833'),
(18, 2, 7, '{\"key\":\"outOfStock\",\"data\":{\"nev\":\"Férfi Póló L-es (Nike)\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.833'),
(19, 3, 7, '{\"key\":\"outOfStock\",\"data\":{\"nev\":\"Férfi Póló L-es (Nike)\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.833'),
(20, 4, 7, '{\"key\":\"outOfStock\",\"data\":{\"nev\":\"Férfi Póló L-es (Nike)\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.833'),
(21, 1, 8, '{\"key\":\"lowStock\",\"data\":{\"nev\":\"Akkus Csavarozó 18V (Makita)\",\"mennyiseg\":6,\"min\":20}}', 'WARNING', 1, 0, NULL, '2026-04-23 06:57:44.857'),
(22, 2, 8, '{\"key\":\"lowStock\",\"data\":{\"nev\":\"Akkus Csavarozó 18V (Makita)\",\"mennyiseg\":6,\"min\":20}}', 'WARNING', 0, 0, NULL, '2026-04-23 06:57:44.857'),
(23, 3, 8, '{\"key\":\"lowStock\",\"data\":{\"nev\":\"Akkus Csavarozó 18V (Makita)\",\"mennyiseg\":6,\"min\":20}}', 'WARNING', 0, 0, NULL, '2026-04-23 06:57:44.857'),
(24, 4, 8, '{\"key\":\"lowStock\",\"data\":{\"nev\":\"Akkus Csavarozó 18V (Makita)\",\"mennyiseg\":6,\"min\":20}}', 'WARNING', 0, 0, NULL, '2026-04-23 06:57:44.857'),
(25, 1, 12, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"Nappali Arckrém Q10 (Nivea)\",\"parcella\":\"C2-2\",\"datum\":\"2026. 03. 09.\"}}', 'ERROR', 1, 0, NULL, '2026-04-23 06:57:44.876'),
(26, 2, 12, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"Nappali Arckrém Q10 (Nivea)\",\"parcella\":\"C2-2\",\"datum\":\"2026. 03. 09.\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.876'),
(27, 3, 12, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"Nappali Arckrém Q10 (Nivea)\",\"parcella\":\"C2-2\",\"datum\":\"2026. 03. 09.\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.876'),
(28, 4, 12, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"Nappali Arckrém Q10 (Nivea)\",\"parcella\":\"C2-2\",\"datum\":\"2026. 03. 09.\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.876'),
(29, 1, 15, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"C-Vitamin 1000mg (Béres)\",\"parcella\":\"C3-1\",\"datum\":\"2026. 03. 01.\"}}', 'ERROR', 1, 0, NULL, '2026-04-23 06:57:44.895'),
(30, 2, 15, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"C-Vitamin 1000mg (Béres)\",\"parcella\":\"C3-1\",\"datum\":\"2026. 03. 01.\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.895'),
(31, 3, 15, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"C-Vitamin 1000mg (Béres)\",\"parcella\":\"C3-1\",\"datum\":\"2026. 03. 01.\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.895'),
(32, 4, 15, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"C-Vitamin 1000mg (Béres)\",\"parcella\":\"C3-1\",\"datum\":\"2026. 03. 01.\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.895'),
(33, 1, 17, '{\"key\":\"lowStock\",\"data\":{\"nev\":\"Gouda Sajt (Tolnatej)\",\"mennyiseg\":13,\"min\":20}}', 'WARNING', 1, 0, NULL, '2026-04-23 06:57:44.908'),
(34, 2, 17, '{\"key\":\"lowStock\",\"data\":{\"nev\":\"Gouda Sajt (Tolnatej)\",\"mennyiseg\":13,\"min\":20}}', 'WARNING', 0, 0, NULL, '2026-04-23 06:57:44.908'),
(35, 3, 17, '{\"key\":\"lowStock\",\"data\":{\"nev\":\"Gouda Sajt (Tolnatej)\",\"mennyiseg\":13,\"min\":20}}', 'WARNING', 0, 0, NULL, '2026-04-23 06:57:44.908'),
(36, 4, 17, '{\"key\":\"lowStock\",\"data\":{\"nev\":\"Gouda Sajt (Tolnatej)\",\"mennyiseg\":13,\"min\":20}}', 'WARNING', 0, 0, NULL, '2026-04-23 06:57:44.908'),
(37, 1, 17, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"Gouda Sajt (Tolnatej)\",\"parcella\":\"B4-1\",\"datum\":\"2026. 03. 04.\"}}', 'ERROR', 1, 0, NULL, '2026-04-23 06:57:44.919'),
(38, 2, 17, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"Gouda Sajt (Tolnatej)\",\"parcella\":\"B4-1\",\"datum\":\"2026. 03. 04.\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.919'),
(39, 3, 17, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"Gouda Sajt (Tolnatej)\",\"parcella\":\"B4-1\",\"datum\":\"2026. 03. 04.\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.919'),
(40, 4, 17, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"Gouda Sajt (Tolnatej)\",\"parcella\":\"B4-1\",\"datum\":\"2026. 03. 04.\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.919'),
(41, 1, 18, '{\"key\":\"outOfStock\",\"data\":{\"nev\":\"OLED TV 65 col (LG)\"}}', 'ERROR', 1, 0, NULL, '2026-04-23 06:57:44.946'),
(42, 2, 18, '{\"key\":\"outOfStock\",\"data\":{\"nev\":\"OLED TV 65 col (LG)\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.946'),
(43, 3, 18, '{\"key\":\"outOfStock\",\"data\":{\"nev\":\"OLED TV 65 col (LG)\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.946'),
(44, 4, 18, '{\"key\":\"outOfStock\",\"data\":{\"nev\":\"OLED TV 65 col (LG)\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.946'),
(45, 1, 21, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"Fájdalomcsillapító (Algopyrin)\",\"parcella\":\"C5-1\",\"datum\":\"2026. 03. 09.\"}}', 'ERROR', 1, 0, NULL, '2026-04-23 06:57:44.965'),
(46, 2, 21, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"Fájdalomcsillapító (Algopyrin)\",\"parcella\":\"C5-1\",\"datum\":\"2026. 03. 09.\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.965'),
(47, 3, 21, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"Fájdalomcsillapító (Algopyrin)\",\"parcella\":\"C5-1\",\"datum\":\"2026. 03. 09.\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.965'),
(48, 4, 21, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"Fájdalomcsillapító (Algopyrin)\",\"parcella\":\"C5-1\",\"datum\":\"2026. 03. 09.\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.965'),
(49, 1, 24, '{\"key\":\"outOfStock\",\"data\":{\"nev\":\"Téli Kabát (Columbia)\"}}', 'ERROR', 1, 0, NULL, '2026-04-23 06:57:44.979'),
(50, 2, 24, '{\"key\":\"outOfStock\",\"data\":{\"nev\":\"Téli Kabát (Columbia)\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.979'),
(51, 3, 24, '{\"key\":\"outOfStock\",\"data\":{\"nev\":\"Téli Kabát (Columbia)\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.979'),
(52, 4, 24, '{\"key\":\"outOfStock\",\"data\":{\"nev\":\"Téli Kabát (Columbia)\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:44.979'),
(53, 1, 29, '{\"key\":\"lowStock\",\"data\":{\"nev\":\"Vasalódeszka (Vileda)\",\"mennyiseg\":4,\"min\":15}}', 'WARNING', 1, 0, NULL, '2026-04-23 06:57:45.001'),
(54, 2, 29, '{\"key\":\"lowStock\",\"data\":{\"nev\":\"Vasalódeszka (Vileda)\",\"mennyiseg\":4,\"min\":15}}', 'WARNING', 0, 0, NULL, '2026-04-23 06:57:45.001'),
(55, 3, 29, '{\"key\":\"lowStock\",\"data\":{\"nev\":\"Vasalódeszka (Vileda)\",\"mennyiseg\":4,\"min\":15}}', 'WARNING', 0, 0, NULL, '2026-04-23 06:57:45.001'),
(56, 4, 29, '{\"key\":\"lowStock\",\"data\":{\"nev\":\"Vasalódeszka (Vileda)\",\"mennyiseg\":4,\"min\":15}}', 'WARNING', 0, 0, NULL, '2026-04-23 06:57:45.001'),
(57, 1, 30, '{\"key\":\"outOfStock\",\"data\":{\"nev\":\"Programozás C#-ban (Kossuth)\"}}', 'ERROR', 1, 0, NULL, '2026-04-23 06:57:45.011'),
(58, 2, 30, '{\"key\":\"outOfStock\",\"data\":{\"nev\":\"Programozás C#-ban (Kossuth)\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:45.011'),
(59, 3, 30, '{\"key\":\"outOfStock\",\"data\":{\"nev\":\"Programozás C#-ban (Kossuth)\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:45.011'),
(60, 4, 30, '{\"key\":\"outOfStock\",\"data\":{\"nev\":\"Programozás C#-ban (Kossuth)\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:45.011'),
(61, 1, 32, '{\"key\":\"lowStock\",\"data\":{\"nev\":\"Vezeték nélküli egér (Logitech)\",\"mennyiseg\":6,\"min\":20}}', 'WARNING', 1, 0, NULL, '2026-04-23 06:57:45.021'),
(62, 2, 32, '{\"key\":\"lowStock\",\"data\":{\"nev\":\"Vezeték nélküli egér (Logitech)\",\"mennyiseg\":6,\"min\":20}}', 'WARNING', 0, 0, NULL, '2026-04-23 06:57:45.021'),
(63, 3, 32, '{\"key\":\"lowStock\",\"data\":{\"nev\":\"Vezeték nélküli egér (Logitech)\",\"mennyiseg\":6,\"min\":20}}', 'WARNING', 0, 0, NULL, '2026-04-23 06:57:45.021'),
(64, 4, 32, '{\"key\":\"lowStock\",\"data\":{\"nev\":\"Vezeték nélküli egér (Logitech)\",\"mennyiseg\":6,\"min\":20}}', 'WARNING', 0, 0, NULL, '2026-04-23 06:57:45.021'),
(65, 1, 33, '{\"key\":\"outOfStock\",\"data\":{\"nev\":\"Fertőtlenítő 750ml (Domestos)\"}}', 'ERROR', 1, 0, NULL, '2026-04-23 06:57:45.028'),
(66, 2, 33, '{\"key\":\"outOfStock\",\"data\":{\"nev\":\"Fertőtlenítő 750ml (Domestos)\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:45.028'),
(67, 3, 33, '{\"key\":\"outOfStock\",\"data\":{\"nev\":\"Fertőtlenítő 750ml (Domestos)\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:45.028'),
(68, 4, 33, '{\"key\":\"outOfStock\",\"data\":{\"nev\":\"Fertőtlenítő 750ml (Domestos)\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:45.028'),
(69, 1, 35, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"Fehérjepor 2kg (Scitec)\",\"parcella\":\"D3-2\",\"datum\":\"2026. 02. 25.\"}}', 'ERROR', 1, 0, NULL, '2026-04-23 06:57:45.040'),
(70, 2, 35, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"Fehérjepor 2kg (Scitec)\",\"parcella\":\"D3-2\",\"datum\":\"2026. 02. 25.\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:45.040'),
(71, 3, 35, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"Fehérjepor 2kg (Scitec)\",\"parcella\":\"D3-2\",\"datum\":\"2026. 02. 25.\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:45.040'),
(72, 4, 35, '{\"key\":\"expiredAlready\",\"data\":{\"nev\":\"Fehérjepor 2kg (Scitec)\",\"parcella\":\"D3-2\",\"datum\":\"2026. 02. 25.\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 06:57:45.040'),
(73, 1, NULL, '{\"key\":\"userRegistered\",\"data\":{\"nev\":\"Kovács János\",\"username\":\"kovacsj\"}}', 'INFO', 1, 0, NULL, '2026-04-23 15:55:35.956'),
(74, 2, NULL, '{\"key\":\"userRegistered\",\"data\":{\"nev\":\"Kovács János\",\"username\":\"kovacsj\"}}', 'INFO', 0, 0, NULL, '2026-04-23 15:55:35.956'),
(75, 4, NULL, '{\"key\":\"userRegistered\",\"data\":{\"nev\":\"Kovács János\",\"username\":\"kovacsj\"}}', 'INFO', 0, 0, NULL, '2026-04-23 15:55:35.956'),
(76, 1, NULL, '{\"key\":\"userRegistered\",\"data\":{\"nev\":\"Kovács János1\",\"username\":\"kovacsja\"}}', 'INFO', 1, 0, NULL, '2026-04-23 16:27:29.042'),
(77, 2, NULL, '{\"key\":\"userRegistered\",\"data\":{\"nev\":\"Kovács János1\",\"username\":\"kovacsja\"}}', 'INFO', 0, 0, NULL, '2026-04-23 16:27:29.042'),
(78, 4, NULL, '{\"key\":\"userRegistered\",\"data\":{\"nev\":\"Kovács János1\",\"username\":\"kovacsja\"}}', 'INFO', 0, 0, NULL, '2026-04-23 16:27:29.042'),
(79, 1, NULL, '{\"key\":\"userDeleted\",\"data\":{\"nev\":\"NigaBiga\",\"username\":\"adi\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 19:39:42.573'),
(80, 4, NULL, '{\"key\":\"userDeleted\",\"data\":{\"nev\":\"NigaBiga\",\"username\":\"adi\"}}', 'ERROR', 0, 0, NULL, '2026-04-23 19:39:42.573');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `product`
--

CREATE TABLE `product` (
  `id` int(11) NOT NULL,
  `nev` varchar(191) NOT NULL,
  `gyarto` varchar(191) NOT NULL,
  `kategoria` enum('ELEKTRONIKA','ELELMISZER','VEGYSZER','IRODASZER','AUTO_MOTOR','RUHAZAT','BARKACS','SPORT','JATEK','HAZTARTAS','KOZMETIKA','KONYVEK','BUTOR','EGESZSEGUGY','EGYEB') NOT NULL DEFAULT 'EGYEB',
  `beszerzesiAr` int(11) NOT NULL DEFAULT 0,
  `eladasiAr` int(11) NOT NULL,
  `suly` double NOT NULL DEFAULT 1,
  `minimumKeszlet` int(11) NOT NULL DEFAULT 10,
  `isDeleted` tinyint(1) NOT NULL DEFAULT 0,
  `letrehozva` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `product`
--

INSERT INTO `product` (`id`, `nev`, `gyarto`, `kategoria`, `beszerzesiAr`, `eladasiAr`, `suly`, `minimumKeszlet`, `isDeleted`, `letrehozva`) VALUES
(1, 'Okostelefon (Samsung Galaxy S24)', 'Samsung', 'ELEKTRONIKA', 350000, 420000, 0.17, 15, 0, '2026-04-23 06:48:20.906'),
(2, 'Trappista Tej 1.5% (Mizo)', 'Sole-Mizo', 'ELELMISZER', 250, 350, 1.05, 100, 0, '2026-04-23 06:48:20.912'),
(3, 'Szeletelt Kenyér (Ceres)', 'Ceres', 'ELELMISZER', 400, 600, 0.5, 30, 0, '2026-04-23 06:48:20.919'),
(4, 'Mosógél 3L (Ariel)', 'Procter & Gamble', 'VEGYSZER', 3500, 5200, 3.2, 20, 0, '2026-04-23 06:48:20.923'),
(5, 'Fénymásolópapír A4 (Xerox)', 'Xerox', 'IRODASZER', 1200, 1800, 2.5, 100, 0, '2026-04-23 06:48:20.928'),
(6, 'Téli Szélvédőmosó -20C (Prevent)', 'Prevent', 'AUTO_MOTOR', 1100, 1990, 4.1, 50, 0, '2026-04-23 06:48:20.930'),
(7, 'Férfi Póló L-es (Nike)', 'Nike', 'RUHAZAT', 4500, 8990, 0.2, 20, 0, '2026-04-23 06:48:20.935'),
(8, 'Akkus Csavarozó 18V (Makita)', 'Makita', 'BARKACS', 32000, 45000, 1.8, 20, 0, '2026-04-23 06:48:20.937'),
(9, 'Kézisúlyzó 10kg', 'Kettlebell', 'SPORT', 8000, 12000, 10, 40, 0, '2026-04-23 06:48:20.941'),
(10, 'Lego Star Wars Millennium Falcon', 'Lego', 'JATEK', 45000, 60000, 2.1, 5, 0, '2026-04-23 06:48:20.946'),
(11, 'Robotporszívó (Xiaomi)', 'Xiaomi', 'HAZTARTAS', 65000, 89000, 3.6, 10, 0, '2026-04-23 06:48:20.950'),
(12, 'Nappali Arckrém Q10 (Nivea)', 'Nivea', 'KOZMETIKA', 1800, 3200, 0.1, 30, 0, '2026-04-23 06:48:20.954'),
(13, 'A Gyűrűk Ura 1. (Európa)', 'Európa Kiadó', 'KONYVEK', 2500, 4500, 0.8, 15, 1, '2026-04-23 06:48:20.960'),
(14, 'Irodai Forgószék (Markus)', 'IKEA', 'BUTOR', 35000, 55000, 22.5, 10, 0, '2026-04-23 06:48:20.966'),
(15, 'C-Vitamin 1000mg (Béres)', 'Béres', 'EGESZSEGUGY', 1500, 2500, 0.05, 50, 0, '2026-04-23 06:48:20.971'),
(16, 'Kétoldalú Ragasztószalag (Tesa)', 'Tesa', 'EGYEB', 800, 1400, 0.15, 40, 0, '2026-04-23 06:48:20.976'),
(17, 'Gouda Sajt (Tolnatej)', 'Tolnatej', 'ELELMISZER', 1900, 2800, 1, 20, 0, '2026-04-23 06:48:20.980'),
(18, 'OLED TV 65 col (LG)', 'LG', 'ELEKTRONIKA', 450000, 550000, 25.4, 5, 0, '2026-04-23 06:48:20.990'),
(19, 'Ablaktisztító szórófejes (Clin)', 'Henkel', 'VEGYSZER', 600, 1100, 0.6, 40, 1, '2026-04-23 06:48:20.997'),
(20, 'Jógamatrac (Domyos)', 'Decathlon', 'SPORT', 2500, 4000, 0.8, 30, 0, '2026-04-23 06:48:21.010'),
(21, 'Fájdalomcsillapító (Algopyrin)', 'Sanofi', 'EGESZSEGUGY', 1200, 2100, 0.02, 100, 0, '2026-04-23 06:48:21.024'),
(22, 'Horganyzott szög 5x50mm 1kg', 'Bolt', 'BARKACS', 900, 1600, 1, 50, 0, '2026-04-23 06:48:21.035'),
(23, 'Catan Telepesei Társasjáték', 'Piatnik', 'JATEK', 9000, 14000, 1.2, 15, 0, '2026-04-23 06:48:21.043'),
(24, 'Téli Kabát (Columbia)', 'Columbia', 'RUHAZAT', 35000, 55000, 1.1, 10, 0, '2026-04-23 06:48:21.049'),
(25, 'Íróasztal 120x60 (JYSK)', 'JYSK', 'BUTOR', 18000, 27000, 18.5, 15, 0, '2026-04-23 06:48:21.052'),
(26, 'Tusfürdő (Old Spice)', 'Procter & Gamble', 'KOZMETIKA', 1100, 1800, 0.45, 40, 0, '2026-04-23 06:48:21.057'),
(27, 'Golyóstoll Kék (Bic)', 'Bic', 'IRODASZER', 50, 120, 0.01, 500, 1, '2026-04-23 06:48:21.062'),
(28, 'Motorolaj 5W40 4L (Castrol)', 'Castrol', 'AUTO_MOTOR', 12000, 18500, 3.8, 20, 0, '2026-04-23 06:48:21.067'),
(29, 'Vasalódeszka (Vileda)', 'Vileda', 'HAZTARTAS', 11000, 16000, 4.5, 15, 0, '2026-04-23 06:48:21.072'),
(30, 'Programozás C#-ban (Kossuth)', 'Kossuth Kiadó', 'KONYVEK', 4500, 7000, 1.1, 5, 0, '2026-04-23 06:48:21.076'),
(31, 'Zabpehely 500g (Gyermelyi)', 'Gyermelyi', 'ELELMISZER', 400, 650, 0.5, 50, 0, '2026-04-23 06:48:21.079'),
(32, 'Vezeték nélküli egér (Logitech)', 'Logitech', 'ELEKTRONIKA', 4500, 7500, 0.15, 20, 0, '2026-04-23 06:48:21.084'),
(33, 'Fertőtlenítő 750ml (Domestos)', 'Unilever', 'VEGYSZER', 800, 1300, 0.8, 40, 0, '2026-04-23 06:48:21.089'),
(34, 'Ragtapasz 100db (Hansaplast)', 'Beiersdorf', 'EGESZSEGUGY', 1500, 2600, 0.05, 30, 0, '2026-04-23 06:48:21.092'),
(35, 'Fehérjepor 2kg (Scitec)', 'Scitec Nutrition', 'SPORT', 14000, 21000, 2.1, 25, 0, '2026-04-23 06:48:21.097');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `nev` varchar(191) NOT NULL,
  `felhasznalonev` varchar(191) NOT NULL,
  `jelszo` varchar(191) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `telefonszam` varchar(191) DEFAULT NULL,
  `avatarUrl` varchar(191) DEFAULT NULL,
  `theme` varchar(191) NOT NULL DEFAULT 'light',
  `language` varchar(191) NOT NULL DEFAULT 'hu',
  `rang` enum('NEZELODO','KEZELO','ADMIN') NOT NULL DEFAULT 'NEZELODO',
  `isBanned` tinyint(1) NOT NULL DEFAULT 0,
  `mustChangePassword` tinyint(1) NOT NULL DEFAULT 0,
  `currentTokenVersion` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `user`
--

INSERT INTO `user` (`id`, `nev`, `felhasznalonev`, `jelszo`, `email`, `telefonszam`, `avatarUrl`, `theme`, `language`, `rang`, `isBanned`, `mustChangePassword`, `currentTokenVersion`) VALUES
(1, 'Bossman', 'admin', '$2b$10$W2HJMnExbm9qvvGWSR.byO1OLIHtHR7vDIZcM7co.YPF83yCuZ.zG', 'admin@raktarweb.hu', '+3619999999', '/uploads/avatars/avatar-1-1776932225488-796548320.jpg', 'light', 'hu', 'ADMIN', 0, 0, 3),
(2, 'Törölt felhasználó', 'torolt_2_376', '$2b$10$FKrPCSMawlN759NfyYVkceuSgqpIkUz5lbBD8A2b/kAp7nFJ4sqda', 'deleted_2@raktar.local', '---', NULL, 'light', 'hu', 'ADMIN', 1, 0, 38),
(3, 'Kovács János', 'kjanos', '$2b$10$uyvP8O8Lv9IM0wWi1YUBlO6wykOPj2o4K42CpNOnBRH2Fa63YgpqO', 'kjanos@raktarweb.hu', '+36201234567', NULL, 'light', 'hu', 'KEZELO', 0, 0, 0),
(4, 'Nagy Ilona', 'nilona', '$2b$10$CSjY6ZSgSl/IUjzZz3D.huiRR835qU5VGneK4MGKIDZ3h0/pdF5rG', 'nilona@raktarweb.hu', '+36302345678', NULL, 'light', 'hu', 'ADMIN', 0, 0, 1),
(5, 'Szabó Péter', 'szpeter', '$2b$10$4ZajHYA.mKnq9ukJSN30FeEGc9uI2EzJF7.nYehnMo6FpE9HRe6ve', 'szpeter@raktarweb.hu', '+36703456789', NULL, 'light', 'hu', 'NEZELODO', 0, 0, 0),
(6, 'Tóth Anikó', 'taniko', '$2b$10$kzjFGVt1CF8JGSFzOOuSTOU8UpwLNpZEE7KWRkI4bFj9rlYtv7vQe', 'taniko@raktarweb.hu', '+36204567890', NULL, 'light', 'hu', 'NEZELODO', 0, 0, 0),
(7, 'Kovács János', 'kovacsj', '$2b$10$BYP3KUEuIRtJKY72apCIPed8FKVR357c6jRITOpY5X3PSb9oA/6WS', 'kovacs@example.com', '+36301234567', NULL, 'light', 'hu', 'NEZELODO', 0, 0, 1),
(11, 'Kovács János1', 'kovacsja', '$2b$10$5dUeuMvxZ0lKtmNg9KDLNePVW1orDbpiqy/rRR/IvG.U4D.2YcbI.', 'kovacas@example.com', '+363012345267', NULL, 'light', 'hu', 'NEZELODO', 0, 0, 1);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `auditlog`
--
ALTER TABLE `auditlog`
  ADD PRIMARY KEY (`id`),
  ADD KEY `AuditLog_userId_fkey` (`userId`),
  ADD KEY `AuditLog_productId_fkey` (`productId`);

--
-- A tábla indexei `batch`
--
ALTER TABLE `batch`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Batch_productId_fkey` (`productId`);

--
-- A tábla indexei `changerequest`
--
ALTER TABLE `changerequest`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ChangeRequest_userId_fkey` (`userId`);

--
-- A tábla indexei `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Notification_userId_fkey` (`userId`),
  ADD KEY `Notification_productId_fkey` (`productId`);

--
-- A tábla indexei `product`
--
ALTER TABLE `product`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `User_felhasznalonev_key` (`felhasznalonev`),
  ADD UNIQUE KEY `User_email_key` (`email`),
  ADD UNIQUE KEY `User_telefonszam_key` (`telefonszam`);

--
-- A tábla indexei `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- A kiírt táblák AUTO_INCREMENT értéke
--

--
-- AUTO_INCREMENT a táblához `auditlog`
--
ALTER TABLE `auditlog`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT a táblához `batch`
--
ALTER TABLE `batch`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT a táblához `changerequest`
--
ALTER TABLE `changerequest`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `notification`
--
ALTER TABLE `notification`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=81;

--
-- AUTO_INCREMENT a táblához `product`
--
ALTER TABLE `product`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT a táblához `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Megkötések a kiírt táblákhoz
--

--
-- Megkötések a táblához `auditlog`
--
ALTER TABLE `auditlog`
  ADD CONSTRAINT `AuditLog_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE CASCADE;

--
-- Megkötések a táblához `batch`
--
ALTER TABLE `batch`
  ADD CONSTRAINT `Batch_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Megkötések a táblához `changerequest`
--
ALTER TABLE `changerequest`
  ADD CONSTRAINT `ChangeRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE CASCADE;

--
-- Megkötések a táblához `notification`
--
ALTER TABLE `notification`
  ADD CONSTRAINT `Notification_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
