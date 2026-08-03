<?php
// api/export.php - Export database contents as JSON
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit();
}

$stmtGejala = $pdo->query("SELECT id, kode, nama FROM gejala ORDER BY id ASC");
$gejala = $stmtGejala->fetchAll();
foreach ($gejala as &$g) { $g['id'] = (int)$g['id']; }

$stmtKerusakan = $pdo->query("SELECT id, kode, nama, solusi FROM kerusakan ORDER BY id ASC");
$kerusakan = $stmtKerusakan->fetchAll();
foreach ($kerusakan as &$k) { $k['id'] = (int)$k['id']; }

$stmtRule = $pdo->query("SELECT id, kerusakan_id, gejala_ids FROM rule ORDER BY id ASC");
$ruleRows = $stmtRule->fetchAll();
$rules = [];
foreach ($ruleRows as $r) {
    $gIds = json_decode($r['gejala_ids'], true) ?? [];
    $rules[] = [
        "id" => (int)$r['id'],
        "kerusakanId" => is_numeric($r['kerusakan_id']) ? (int)$r['kerusakan_id'] : $r['kerusakan_id'],
        "gejalaIds" => array_map(function($v) { return is_numeric($v) ? (int)$v : $v; }, $gIds)
    ];
}

header('Content-Type: application/json');
header('Content-Disposition: attachment; filename="sistem-pakar-backup.json"');
echo json_encode([
    "gejala" => $gejala,
    "kerusakan" => kerusakan,
    "rules" => $rules
], JSON_PRETTY_PRINT);
?>
