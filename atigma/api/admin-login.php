<?php
require_once __DIR__ . '/auth.php';

handle_preflight();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, ['error' => 'Method not allowed']);
}

$body = read_json_body();
$passcode = $body['passcode'] ?? null;
if (!$passcode) {
    json_response(400, ['error' => 'Passcode is required']);
}

$pdo = get_pdo();
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

// ---------- Rate limiting: 5 failed attempts locks an IP out for 15 minutes ----------
$attemptStmt = $pdo->prepare('SELECT attempts, locked_until FROM login_attempts WHERE ip_address = ?');
$attemptStmt->execute([$ip]);
$attemptRow = $attemptStmt->fetch();

if ($attemptRow && $attemptRow['locked_until'] && strtotime($attemptRow['locked_until']) > time()) {
    $waitMinutes = ceil((strtotime($attemptRow['locked_until']) - time()) / 60);
    json_response(429, ['error' => "Too many attempts. Try again in about {$waitMinutes} minute(s)."]);
}

// ---------- Check the passcode ----------
$stmt = $pdo->prepare("SELECT setting_value FROM site_settings WHERE setting_key = 'admin_passcode'");
$stmt->execute();
$row = $stmt->fetch();
$stored = $row ? $row['setting_value'] : null;

$looksHashed = $stored && strpos($stored, '$2') === 0;
$valid = $stored && ($looksHashed ? password_verify($passcode, $stored) : hash_equals($stored, $passcode));

if (!$valid) {
    $attempts = ($attemptRow['attempts'] ?? 0) + 1;
    $lockedUntil = $attempts >= 5 ? date('Y-m-d H:i:s', time() + 15 * 60) : null;

    $pdo->prepare(
        'INSERT INTO login_attempts (ip_address, attempts, locked_until) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE attempts = ?, locked_until = ?'
    )->execute([$ip, $attempts, $lockedUntil, $attempts, $lockedUntil]);

    json_response(401, ['error' => 'That passcode is not right.']);
}

// ---------- Success: reset attempts, and transparently upgrade a legacy plain-text passcode to bcrypt ----------
$pdo->prepare('DELETE FROM login_attempts WHERE ip_address = ?')->execute([$ip]);

if (!$looksHashed) {
    $newHash = password_hash($passcode, PASSWORD_DEFAULT);
    $pdo->prepare("UPDATE site_settings SET setting_value = ? WHERE setting_key = 'admin_passcode'")
        ->execute([$newHash]);
}

json_response(200, ['token' => sign_admin_token()]);
