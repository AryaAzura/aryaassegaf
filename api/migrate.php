<?php
// api/migrate.php — Script migrasi SEKALI JALAN
// Jalankan dari browser: http://localhost/sistem-pakar/api/migrate.php
// Setelah berhasil, HAPUS file ini untuk keamanan.
require_once __DIR__ . '/config.php';

$results = [];

// 1. Tambah / ubah kolom bobot di tabel gejala menjadi DECIMAL(3,1)
try {
    $check = $pdo->query("SHOW COLUMNS FROM gejala LIKE 'bobot'");
    if ($check->rowCount() === 0) {
        // Kolom belum ada — tambahkan sebagai DECIMAL
        $pdo->exec("ALTER TABLE gejala ADD COLUMN bobot DECIMAL(3,1) NOT NULL DEFAULT 0.5 AFTER nama");
        $results[] = "✅ Kolom 'bobot' (DECIMAL 0.0–1.0) berhasil ditambahkan ke tabel 'gejala'.";
    } else {
        // Kolom sudah ada — modifikasi tipenya menjadi DECIMAL (kalau sebelumnya INT)
        $pdo->exec("ALTER TABLE gejala MODIFY COLUMN bobot DECIMAL(3,1) NOT NULL DEFAULT 0.5");
        $results[] = "✅ Kolom 'bobot' berhasil diubah ke tipe DECIMAL(3,1) dengan range 0.0–1.0.";
    }
} catch (PDOException $e) {
    $results[] = "❌ Gagal alter tabel gejala: " . $e->getMessage();
}

// 2. Buat tabel riwayat_diagnosa (jika belum ada)
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS `riwayat_diagnosa` (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $results[] = "✅ Tabel 'riwayat_diagnosa' siap (dibuat / sudah ada).";
} catch (PDOException $e) {
    $results[] = "❌ Gagal membuat tabel riwayat_diagnosa: " . $e->getMessage();
}

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Migrasi Database</title>
  <style>
    body { font-family: sans-serif; max-width: 600px; margin: 60px auto; padding: 20px; background: #0f1117; color: #e2e8f0; }
    h1 { color: #7c3aed; }
    .result { background: #1e293b; padding: 14px 18px; border-radius: 8px; margin: 10px 0; font-size: 1rem; line-height: 1.6; }
    .note { background: #92400e33; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px 18px; margin-top: 20px; color: #fbbf24; font-size: 0.9rem;}
  </style>
</head>
<body>
  <h1>🗄️ Migrasi Database — Sistem Pakar CBR</h1>
  <?php foreach ($results as $r): ?>
    <div class="result"><?= $r ?></div>
  <?php endforeach; ?>
  <div class="note">
    ⚠️ <strong>Perhatian:</strong> Setelah migrasi berhasil, <strong>hapus file <code>api/migrate.php</code></strong> ini dari server untuk keamanan.
  </div>
</body>
</html>
