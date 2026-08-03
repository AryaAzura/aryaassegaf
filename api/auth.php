<?php
// api/auth.php - Authentication API (Login / Logout / Check)

// ── Proper session config BEFORE session_start ──
ini_set('session.cookie_httponly', 1);
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_samesite', 'Lax');

session_start();

// Allow credentials for same-origin (localhost)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin) {
    header("Access-Control-Allow-Origin: {$origin}");
    header("Access-Control-Allow-Credentials: true");
} else {
    header("Access-Control-Allow-Origin: *");
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$db_host = 'localhost';
$db_name = 'sistempakar';
$db_user = 'root';
$db_pass = '';

try {
    $pdo = new PDO("mysql:host={$db_host};dbname={$db_name};charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Koneksi database gagal: " . $e->getMessage()]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ==================== CHECK SESSION ====================
if ($action === 'check') {
    if (isset($_SESSION['user_id'])) {
        echo json_encode([
            "loggedIn" => true,
            "user"     => [
                "id"       => $_SESSION['user_id'],
                "username" => $_SESSION['username'],
                "nama"     => $_SESSION['nama'],
                "role"     => $_SESSION['role'],
            ]
        ]);
    } else {
        echo json_encode(["loggedIn" => false]);
    }
    exit();
}

// ==================== LOGOUT ====================
if ($action === 'logout') {
    // Clear all session data properly
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(), '',
            time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    echo json_encode(["success" => true, "message" => "Logout berhasil"]);
    exit();
}

// ==================== LOGIN ====================
if ($method === 'POST' && $action === 'login') {
    $raw  = file_get_contents("php://input");
    $data = json_decode($raw, true) ?? [];

    $username = trim($data['username'] ?? '');
    $password = trim($data['password'] ?? '');

    if (!$username || !$password) {
        http_response_code(400);
        echo json_encode(["error" => "Username dan password wajib diisi"]);
        exit();
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND is_active = 1 LIMIT 1");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(["error" => "Username atau password salah"]);
        exit();
    }

    // Update last login
    $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?")->execute([$user['id']]);

    // Regenerate session ID to prevent fixation
    session_regenerate_id(true);

    $_SESSION['user_id']  = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['nama']     = $user['nama'];
    $_SESSION['role']     = $user['role'];

    echo json_encode([
        "success" => true,
        "message" => "Login berhasil",
        "user"    => [
            "id"       => $user['id'],
            "username" => $user['username'],
            "nama"     => $user['nama'],
            "role"     => $user['role'],
        ]
    ]);
    exit();
}

http_response_code(404);
echo json_encode(["error" => "Endpoint tidak ditemukan"]);
?>
