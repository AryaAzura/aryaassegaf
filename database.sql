-- SQL Setup for Sistem Pakar (XAMPP / MySQL)
-- Database Name: sistempakar
-- Run this file once to initialize the database & default accounts

CREATE DATABASE IF NOT EXISTS `sistempakar` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `sistempakar`;

-- Table Gejala
CREATE TABLE IF NOT EXISTS `gejala` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `kode` VARCHAR(20) NOT NULL UNIQUE,
  `nama` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table Kerusakan
CREATE TABLE IF NOT EXISTS `kerusakan` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `kode` VARCHAR(20) NOT NULL UNIQUE,
  `nama` VARCHAR(255) NOT NULL,
  `solusi` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table Rule
CREATE TABLE IF NOT EXISTS `rule` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `kerusakan_id` INT NOT NULL,
  `gejala_ids` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`kerusakan_id`) REFERENCES `kerusakan`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Initial Sample Data (Optional)
INSERT INTO `gejala` (`id`, `kode`, `nama`) VALUES
(1, 'G01', 'Layar laptop mati / tidak tampil'),
(2, 'G02', 'Lampu indikator power menyala'),
(3, 'G03', 'Bunyi beeping berulang saat booting'),
(4, 'G04', 'Laptop cepat panas (overheat)'),
(5, 'G05', 'Kipas angin laptop berbunyi bising / tidak berputar'),
(6, 'G06', 'Sistem sering restart sendiri / Blue Screen (BSOD)'),
(7, 'G07', 'Baterai tidak terisi saat di-charge'),
(8, 'G08', 'Touchpad / Keyboard tidak merespons');

INSERT INTO `kerusakan` (`id`, `kode`, `nama`, `solusi`) VALUES
(1, 'K01', 'Kerusakan RAM / Memori', 'Bersihkan pin RAM menggunakan penghapus pensil, atau ganti RAM dengan unit baru.'),
(2, 'K02', 'Masalah Thermal Cooling System / Overheat', 'Bersihkan debu pada fan radiator laptop, dan ganti thermal paste pada processor/GPU.'),
(3, 'K03', 'Kerusakan Baterai / Adapter Charger', 'Periksa adaptor daya menggunakan multimeter, dan ganti baterai laptop yang sudah drop.'),
(4, 'K04', 'Kerusakan Mainboard / VGA Chipset', 'Bawa laptop ke service center untuk reballing chip VGA atau penggantian IC motherboard.');

INSERT INTO `rule` (`id`, `kerusakan_id`, `gejala_ids`) VALUES
(1, 1, '[1, 2, 3]'),
(2, 2, '[4, 5, 6]'),
(3, 3, '[7]'),
(4, 4, '[1, 6]');

-- ==================== TABLE RIWAYAT DIAGNOSA (CBR History) ====================
CREATE TABLE IF NOT EXISTS `riwayat_diagnosa` (
  `id`                 INT AUTO_INCREMENT PRIMARY KEY,
  `nama_pasien`        VARCHAR(255) NOT NULL DEFAULT '',
  `nama_pemeriksa`     VARCHAR(255) NOT NULL DEFAULT '',
  `gejala_snapshot`    TEXT NOT NULL,
  `hasil_cbr`          TEXT NOT NULL,
  `diagnosa_sistem_id` INT DEFAULT NULL,
  `diagnosa_revisi_id` INT DEFAULT NULL,
  `catatan_revisi`     TEXT DEFAULT NULL,
  `status`             ENUM('pending','valid','direvisi') NOT NULL DEFAULT 'pending',
  `revised_by`         VARCHAR(100) DEFAULT NULL,
  `revised_at`         DATETIME DEFAULT NULL,
  `created_at`         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`diagnosa_sistem_id`) REFERENCES `kerusakan`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`diagnosa_revisi_id`) REFERENCES `kerusakan`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================== TABLE USERS (Login System) ====================
CREATE TABLE IF NOT EXISTS `users` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `username`   VARCHAR(50) NOT NULL UNIQUE,
  `password`   VARCHAR(255) NOT NULL,
  `nama`       VARCHAR(100) NOT NULL,
  `role`       ENUM('admin','user') NOT NULL DEFAULT 'user',
  `is_active`  TINYINT(1) NOT NULL DEFAULT 1,
  `last_login` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default accounts
-- admin : password = admin123
-- user  : password = user123
INSERT INTO `users` (`username`, `password`, `nama`, `role`) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'admin'),
('user',  '$2y$10$TKh8H1.PFbuSpgzrXNp37ezJdMZfTz2kRbzKQAJTqBuVjMEXL3ISi', 'Pengguna Umum', 'user');
-- NOTE: Password hashes above are from password_hash() with default bcrypt.
-- admin123 hash : $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- user123  hash : $2y$10$TKh8H1.PFbuSpgzrXNp37ezJdMZfTz2kRbzKQAJTqBuVjMEXL3ISi

