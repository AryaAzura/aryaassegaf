<?php
// api/setup_users.php
// ============================================================
// Installer akun default untuk Sistem Pakar
// Aman dijalankan BERULANG KALI — tidak akan menimpa akun yang
// sudah ada. Hanya membuat akun jika belum ada di database.
//
// Akses via browser:
//   http://localhost/sistem-pakar/api/setup_users.php
// ============================================================

$db_host = 'localhost';
$db_name = 'sistempakar';
$db_user = 'root';
$db_pass = '';

try {
    $pdo = new PDO(
        "mysql:host={$db_host};dbname={$db_name};charset=utf8mb4",
        $db_user, $db_pass,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $e) {
    die('<p style="color:red;font-family:sans-serif">Koneksi database gagal: ' . $e->getMessage() . '</p>');
}

// 1. Pastikan tabel users ada
$pdo->exec("
    CREATE TABLE IF NOT EXISTS `users` (
      `id`         INT AUTO_INCREMENT PRIMARY KEY,
      `username`   VARCHAR(50)  NOT NULL UNIQUE,
      `password`   VARCHAR(255) NOT NULL,
      `nama`       VARCHAR(100) NOT NULL,
      `role`       ENUM('admin','user') NOT NULL DEFAULT 'user',
      `is_active`  TINYINT(1)   NOT NULL DEFAULT 1,
      `last_login` DATETIME     DEFAULT NULL,
      `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");

// 2. Daftar akun default
$defaults = [
    ['username' => 'admin', 'password' => 'admin123', 'nama' => 'Administrator',  'role' => 'admin'],
    ['username' => 'user',  'password' => 'user123',  'nama' => 'Pengguna Umum',  'role' => 'user'],
];

$results = [];

foreach ($defaults as $acc) {
    // Cek apakah user sudah ada
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$acc['username']]);
    $existing = $stmt->fetch();

    if ($existing) {
        $results[] = array_merge($acc, ['status' => 'skip', 'msg' => 'Sudah ada, dilewati']);
    } else {
        $hash = password_hash($acc['password'], PASSWORD_BCRYPT);
        $pdo->prepare("INSERT INTO users (username, password, nama, role, is_active) VALUES (?,?,?,?,1)")
            ->execute([$acc['username'], $hash, $acc['nama'], $acc['role']]);
        $results[] = array_merge($acc, ['status' => 'created', 'msg' => 'Berhasil dibuat']);
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Setup Users — Sistem Pakar</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',sans-serif;background:#0a0e1a;color:#f1f5f9;padding:48px 24px;min-height:100vh}
    .card{max-width:820px;margin:0 auto;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:36px}
    h2{font-size:1.4rem;color:#818cf8;margin-bottom:6px}
    .sub{font-size:0.85rem;color:#64748b;margin-bottom:28px}
    table{width:100%;border-collapse:collapse;margin-top:4px}
    th,td{border:1px solid #1e293b;padding:11px 16px;font-size:0.85rem;text-align:left}
    th{background:#1e293b;color:#94a3b8;font-weight:600;text-transform:uppercase;font-size:0.72rem;letter-spacing:.06em}
    .created{color:#22c55e;font-weight:600}
    .skip{color:#f59e0b;font-weight:600}
    .pwd{font-family:monospace;color:#f59e0b;font-size:0.9rem}
    .info{margin-top:24px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:10px;padding:16px 20px;font-size:0.83rem;color:#a5b4fc;line-height:1.7}
    .info strong{color:#818cf8}
    .btn{display:inline-block;margin-top:24px;padding:12px 28px;background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:0.9rem}
    .btn:hover{opacity:.85}
  </style>
</head>
<body>
  <div class="card">
    <h2>⚙️ Setup Akun Sistem Pakar</h2>
    <p class="sub">Script ini aman dijalankan berulang kali. Akun yang sudah ada tidak akan ditimpa.</p>

    <table>
      <thead>
        <tr>
          <th>Username</th>
          <th>Password</th>
          <th>Nama</th>
          <th>Role</th>
          <th>Keterangan</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($results as $r): ?>
        <tr>
          <td><strong><?= htmlspecialchars($r['username']) ?></strong></td>
          <td class="pwd"><?= htmlspecialchars($r['password']) ?></td>
          <td><?= htmlspecialchars($r['nama']) ?></td>
          <td><?= htmlspecialchars($r['role']) ?></td>
          <td class="<?= $r['status'] ?>"><?= $r['status'] === 'created' ? '✓ ' : '⚠ ' ?><?= $r['msg'] ?></td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>

    <div class="info">
      <strong>ℹ️ Catatan Portabilitas:</strong><br>
      Setiap kali pindah ke PC baru atau install ulang XAMPP, jalankan file ini
      (<code>api/setup_users.php</code>) sekali melalui browser untuk membuat akun default.<br>
      File ini <strong>aman untuk disimpan</strong> — akun yang sudah ada tidak akan tertimpa.
    </div>

    <a class="btn" href="../login.html">→ Pergi ke Halaman Login</a>
  </div>
</body>
</html>
