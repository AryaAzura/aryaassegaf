<?php
// api/kerusakan.php - CRUD endpoint for Kerusakan
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT id, kode, nama, solusi FROM kerusakan ORDER BY id ASC");
        $data = $stmt->fetchAll();
        foreach ($data as &$row) {
            $row['id'] = (int)$row['id'];
        }
        echo json_encode($data);
        break;

    case 'POST':
        $input = getJsonInput();
        $kode = trim($input['kode'] ?? '');
        $nama = trim($input['nama'] ?? '');
        $solusi = trim($input['solusi'] ?? '');

        if (empty($kode) || empty($nama)) {
            http_response_code(400);
            echo json_encode(["error" => "Kode dan Nama Kerusakan wajib diisi"]);
            exit();
        }

        $check = $pdo->prepare("SELECT id FROM kerusakan WHERE LOWER(kode) = LOWER(?)");
        $check->execute([$kode]);
        if ($check->fetch()) {
            http_response_code(400);
            echo json_encode(["error" => "Kode kerusakan sudah ada"]);
            exit();
        }

        $stmt = $pdo->prepare("INSERT INTO kerusakan (kode, nama, solusi) VALUES (?, ?, ?)");
        $stmt->execute([strtoupper($kode), $nama, $solusi]);
        $newId = (int)$pdo->lastInsertId();

        echo json_encode([
            "success" => true,
            "message" => "Kerusakan berhasil ditambahkan",
            "data" => ["id" => $newId, "kode" => strtoupper($kode), "nama" => $nama, "solusi" => $solusi]
        ]);
        break;

    case 'PUT':
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        $input = getJsonInput();
        $nama = trim($input['nama'] ?? '');
        $solusi = trim($input['solusi'] ?? '');

        if ($id <= 0 || empty($nama)) {
            http_response_code(400);
            echo json_encode(["error" => "ID and Nama required"]);
            exit();
        }

        $stmt = $pdo->prepare("UPDATE kerusakan SET nama = ?, solusi = ? WHERE id = ?");
        $stmt->execute([$nama, $solusi, $id]);

        echo json_encode([
            "success" => true,
            "message" => "Kerusakan berhasil diperbarui"
        ]);
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(["error" => "ID tidak valid"]);
            exit();
        }

        $stmt = $pdo->prepare("DELETE FROM kerusakan WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode([
            "success" => true,
            "message" => "Kerusakan berhasil dihapus"
        ]);
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
        break;
}
?>
