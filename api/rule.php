<?php
// api/rule.php - CRUD endpoint for Rules
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT id, kerusakan_id, gejala_ids FROM rule ORDER BY id ASC");
        $rows = $stmt->fetchAll();
        $data = [];
        foreach ($rows as $row) {
            $rawGejala = json_decode($row['gejala_ids'], true);
            if (!is_array($rawGejala)) {
                $rawGejala = [];
            }
            // Ensure integer format for gejala IDs
            $gejalaIds = array_map(function($val) {
                return is_numeric($val) ? (int)$val : $val;
            }, $rawGejala);

            $data[] = [
                "id" => (int)$row['id'],
                "kerusakanId" => is_numeric($row['kerusakan_id']) ? (int)$row['kerusakan_id'] : $row['kerusakan_id'],
                "gejalaIds" => $gejalaIds
            ];
        }
        echo json_encode($data);
        break;

    case 'POST':
        $input = getJsonInput();
        $kerusakanId = $input['kerusakanId'] ?? null;
        $gejalaIds = $input['gejalaIds'] ?? [];

        if (empty($kerusakanId) || empty($gejalaIds) || !is_array($gejalaIds)) {
            http_response_code(400);
            echo json_encode(["error" => "Kerusakan dan Gejala wajib dipilih"]);
            exit();
        }

        // Check if rule for this kerusakan already exists
        $check = $pdo->prepare("SELECT id FROM rule WHERE kerusakan_id = ?");
        $check->execute([$kerusakanId]);
        if ($check->fetch()) {
            http_response_code(400);
            echo json_encode(["error" => "Rule untuk kerusakan ini sudah ada"]);
            exit();
        }

        $jsonGejala = json_encode(array_values($gejalaIds));
        $stmt = $pdo->prepare("INSERT INTO rule (kerusakan_id, gejala_ids) VALUES (?, ?)");
        $stmt->execute([$kerusakanId, $jsonGejala]);
        $newId = (int)$pdo->lastInsertId();

        echo json_encode([
            "success" => true,
            "message" => "Rule berhasil ditambahkan",
            "data" => ["id" => $newId, "kerusakanId" => $kerusakanId, "gejalaIds" => $gejalaIds]
        ]);
        break;

    case 'PUT':
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        $input = getJsonInput();
        $kerusakanId = $input['kerusakanId'] ?? null;
        $gejalaIds = $input['gejalaIds'] ?? [];

        if ($id <= 0 || empty($kerusakanId) || empty($gejalaIds)) {
            http_response_code(400);
            echo json_encode(["error" => "ID, Kerusakan, dan Gejala wajib diisi"]);
            exit();
        }

        $jsonGejala = json_encode(array_values($gejalaIds));
        $stmt = $pdo->prepare("UPDATE rule SET kerusakan_id = ?, gejala_ids = ? WHERE id = ?");
        $stmt->execute([$kerusakanId, $jsonGejala, $id]);

        echo json_encode([
            "success" => true,
            "message" => "Rule berhasil diperbarui"
        ]);
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(["error" => "ID tidak valid"]);
            exit();
        }

        $stmt = $pdo->prepare("DELETE FROM rule WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode([
            "success" => true,
            "message" => "Rule berhasil dihapus"
        ]);
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
        break;
}
?>
