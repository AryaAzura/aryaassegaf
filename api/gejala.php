<?php
// api/gejala.php - CRUD endpoint for Gejala
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT id, kode, nama, bobot FROM gejala ORDER BY id ASC");
        $data = $stmt->fetchAll();
        // Convert id to int and bobot to float for consistent JS consumption
        foreach ($data as &$row) {
            $row['id']    = (int)$row['id'];
            $row['bobot'] = round((float)($row['bobot'] ?? 0.5), 1);
        }
        echo json_encode($data);
        break;

    case 'POST':
        $input = getJsonInput();
        $kode  = trim($input['kode'] ?? '');
        $nama  = trim($input['nama'] ?? '');
        $bobot = isset($input['bobot']) ? round((float)$input['bobot'], 1) : 0.5;
        if ($bobot < 0.0) $bobot = 0.0;
        if ($bobot > 1.0) $bobot = 1.0;

        if (empty($kode) || empty($nama)) {
            http_response_code(400);
            echo json_encode(["error" => "Kode dan Nama Gejala wajib diisi"]);
            exit();
        }

        // Check duplicate code
        $check = $pdo->prepare("SELECT id FROM gejala WHERE LOWER(kode) = LOWER(?)");
        $check->execute([$kode]);
        if ($check->fetch()) {
            http_response_code(400);
            echo json_encode(["error" => "Kode gejala sudah ada"]);
            exit();
        }

        $stmt = $pdo->prepare("INSERT INTO gejala (kode, nama, bobot) VALUES (?, ?, ?)");
        $stmt->execute([strtoupper($kode), $nama, $bobot]);
        $newId = (int)$pdo->lastInsertId();

        echo json_encode([
            "success" => true,
            "message" => "Gejala berhasil ditambahkan",
            "data" => ["id" => $newId, "kode" => strtoupper($kode), "nama" => $nama, "bobot" => $bobot]
        ]);
        break;

    case 'PUT':
        $id    = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        $input = getJsonInput();
        $kode  = trim($input['kode'] ?? '');
        $nama  = trim($input['nama'] ?? '');
        $bobot = isset($input['bobot']) ? round((float)$input['bobot'], 1) : 0.5;
        if ($bobot < 0.0) $bobot = 0.0;
        if ($bobot > 1.0) $bobot = 1.0;

        if ($id <= 0 || empty($nama)) {
            http_response_code(400);
            echo json_encode(["error" => "ID and Nama required"]);
            exit();
        }

        $stmt = $pdo->prepare("UPDATE gejala SET nama = ?, bobot = ? WHERE id = ?");
        $stmt->execute([$nama, $bobot, $id]);

        echo json_encode([
            "success" => true,
            "message" => "Gejala berhasil diperbarui"
        ]);
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(["error" => "ID tidak valid"]);
            exit();
        }

        $stmt = $pdo->prepare("DELETE FROM gejala WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode([
            "success" => true,
            "message" => "Gejala berhasil dihapus"
        ]);
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
        break;
}
?>
