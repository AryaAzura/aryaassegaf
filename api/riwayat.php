<?php
// api/riwayat.php — CRUD Riwayat Diagnosa + CBR Revise
// GET, PUT, DELETE : admin only
// POST             : semua user yang login (auto-save setelah diagnosa)

session_start(); // Must be FIRST, before config.php sends any headers

require_once __DIR__ . '/config.php';

$role     = $_SESSION['role']    ?? '';
$userId   = $_SESSION['user_id'] ?? null;
$isAdmin  = $role === 'admin';
$isLogged = $userId !== null;

$method = $_SERVER['REQUEST_METHOD'];

// ── Auth guard ──────────────────────────────────────────────────────────────
if ($method === 'POST' && !$isLogged) {
    http_response_code(401);
    echo json_encode(['error' => 'Harus login terlebih dahulu']);
    exit();
}

if (in_array($method, ['GET', 'PUT', 'DELETE']) && !$isAdmin) {
    http_response_code(403);
    echo json_encode(['error' => 'Akses ditolak. Hanya admin yang dapat mengakses riwayat.']);
    exit();
}

// ── CRUD ────────────────────────────────────────────────────────────────────
switch ($method) {

    // ── LIST ─────────────────────────────────────────────────────────────────
    case 'GET':
        $stmt = $pdo->query("
            SELECT r.*,
                   ks.nama AS nama_kerusakan_sistem,
                   ks.kode AS kode_kerusakan_sistem,
                   kv.nama AS nama_kerusakan_revisi,
                   kv.kode AS kode_kerusakan_revisi
            FROM  riwayat_diagnosa r
            LEFT JOIN kerusakan ks ON r.diagnosa_sistem_id = ks.id
            LEFT JOIN kerusakan kv ON r.diagnosa_revisi_id = kv.id
            ORDER BY r.created_at DESC
        ");
        $rows = $stmt->fetchAll();

        foreach ($rows as &$row) {
            $row['id']                 = (int)$row['id'];
            $row['diagnosa_sistem_id'] = $row['diagnosa_sistem_id'] ? (int)$row['diagnosa_sistem_id'] : null;
            $row['diagnosa_revisi_id'] = $row['diagnosa_revisi_id'] ? (int)$row['diagnosa_revisi_id'] : null;
            $row['gejala_snapshot']    = json_decode($row['gejala_snapshot'], true) ?? [];
            $row['hasil_cbr']          = json_decode($row['hasil_cbr'],       true) ?? [];
        }
        echo json_encode($rows);
        break;

    // ── SAVE (auto-save setelah prosesDiagnosa) ───────────────────────────────
    case 'POST':
        $input           = getJsonInput();
        $namaPasien      = trim($input['namaPasien']      ?? '');
        $namaPemeriksa   = trim($input['namaPemeriksa']   ?? '');
        $gejalaSnapshot  = $input['gejalaSnapshot']        ?? [];
        $hasilCbr        = $input['hasilCbr']              ?? [];
        $diagnosaSistemId = isset($input['diagnosaSistemId']) && $input['diagnosaSistemId']
                            ? (int)$input['diagnosaSistemId'] : null;

        if (empty($gejalaSnapshot) || empty($hasilCbr)) {
            http_response_code(400);
            echo json_encode(['error' => 'Data gejala dan hasil CBR wajib ada']);
            exit();
        }

        $stmt = $pdo->prepare("
            INSERT INTO riwayat_diagnosa
              (nama_pasien, nama_pemeriksa, gejala_snapshot, hasil_cbr, diagnosa_sistem_id, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
        ");
        $stmt->execute([
            $namaPasien,
            $namaPemeriksa,
            json_encode($gejalaSnapshot, JSON_UNESCAPED_UNICODE),
            json_encode($hasilCbr,       JSON_UNESCAPED_UNICODE),
            $diagnosaSistemId,
        ]);
        $newId = (int)$pdo->lastInsertId();

        echo json_encode(['success' => true, 'id' => $newId]);
        break;

    // ── REVISE (admin validasi / koreksi — fase Revise CBR) ──────────────────
    case 'PUT':
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'ID tidak valid']);
            exit();
        }

        $input            = getJsonInput();
        $diagnosaRevisiId = isset($input['diagnosaRevisiId']) && $input['diagnosaRevisiId']
                            ? (int)$input['diagnosaRevisiId'] : null;
        $catatanRevisi    = trim($input['catatanRevisi'] ?? '');
        $revisedBy        = trim($input['revisedBy']     ?? ($role === 'admin' ? 'admin' : ''));

        // Tentukan status: valid kalau sama dgn sistem, direvisi kalau beda
        $existing = $pdo->prepare("SELECT diagnosa_sistem_id FROM riwayat_diagnosa WHERE id = ?");
        $existing->execute([$id]);
        $rec    = $existing->fetch();
        $status = 'valid';
        if ($diagnosaRevisiId && $rec && (int)$rec['diagnosa_sistem_id'] !== $diagnosaRevisiId) {
            $status = 'direvisi';
        }

        $stmt = $pdo->prepare("
            UPDATE riwayat_diagnosa
            SET diagnosa_revisi_id = ?,
                catatan_revisi     = ?,
                status             = ?,
                revised_by         = ?,
                revised_at         = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$diagnosaRevisiId, $catatanRevisi, $status, $revisedBy, $id]);

        echo json_encode(['success' => true, 'status' => $status]);
        break;

    // ── DELETE ────────────────────────────────────────────────────────────────
    case 'DELETE':
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'ID tidak valid']);
            exit();
        }

        $stmt = $pdo->prepare("DELETE FROM riwayat_diagnosa WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode(['success' => true, 'message' => 'Riwayat berhasil dihapus']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>
