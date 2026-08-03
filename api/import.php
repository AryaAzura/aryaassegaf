<?php
// api/import.php - Import database contents from JSON payload
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit();
}

$input = getJsonInput();

if (!isset($input['gejala']) && !isset($input['kerusakan']) && !isset($input['rules'])) {
    http_response_code(400);
    echo json_encode(["error" => "Format JSON tidak valid"]);
    exit();
}

try {
    $pdo->beginTransaction();

    // Disable foreign key checks temporarily for clean truncate/replace
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    $pdo->exec("TRUNCATE TABLE rule");
    $pdo->exec("TRUNCATE TABLE kerusakan");
    $pdo->exec("TRUNCATE TABLE gejala");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

    // Map old IDs to new auto-increment IDs if necessary
    $gejalaMap = [];
    if (!empty($input['gejala']) && is_array($input['gejala'])) {
        $stmtG = $pdo->prepare("INSERT INTO gejala (kode, nama) VALUES (?, ?)");
        foreach ($input['gejala'] as $g) {
            $stmtG->execute([$g['kode'], $g['nama']]);
            $newId = (int)$pdo->lastInsertId();
            if (isset($g['id'])) {
                $gejalaMap[$g['id']] = $newId;
            }
        }
    }

    $kerusakanMap = [];
    if (!empty($input['kerusakan']) && is_array($input['kerusakan'])) {
        $stmtK = $pdo->prepare("INSERT INTO kerusakan (kode, nama, solusi) VALUES (?, ?, ?)");
        foreach ($input['kerusakan'] as $k) {
            $stmtK->execute([$k['kode'], $k['nama'], $k['solusi'] ?? '']);
            $newId = (int)$pdo->lastInsertId();
            if (isset($k['id'])) {
                $kerusakanMap[$k['id']] = $newId;
            }
        }
    }

    if (!empty($input['rules']) && is_array($input['rules'])) {
        $stmtR = $pdo->prepare("INSERT INTO rule (kerusakan_id, gejala_ids) VALUES (?, ?)");
        foreach ($input['rules'] as $r) {
            $kId = $r['kerusakanId'];
            $targetKId = $kerusakanMap[$kId] ?? $kId;

            $mappedGejalaIds = [];
            foreach ($r['gejalaIds'] as $gid) {
                $mappedGejalaIds[] = $gejalaMap[$gid] ?? $gid;
            }

            $stmtR->execute([$targetKId, json_encode($mappedGejalaIds)]);
        }
    }

    $pdo->commit();
    echo json_encode(["success" => true, "message" => "Import data berhasil"]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(["error" => "Import gagal: " . $e->getMessage()]);
}
?>
