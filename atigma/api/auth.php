<?php
require_once __DIR__ . '/config.php';

function json_response($statusCode, $data) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    echo json_encode($data);
    exit;
}

function handle_preflight() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        json_response(200, []);
    }
}

function get_auth_header() {
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        foreach ($headers as $key => $value) {
            if (strtolower($key) === 'authorization') return $value;
        }
    }
    // Fallback for servers where getallheaders() isn't available.
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) return $_SERVER['HTTP_AUTHORIZATION'];
    if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    return '';
}

// A small self-contained signed token (no external libraries needed —
// shared hosting often can't run "composer install"). Not a full JWT,
// but the same idea: payload + HMAC signature, so the server can trust
// it without storing sessions.
function sign_admin_token() {
    $payload = ['role' => 'admin', 'exp' => time() + 12 * 3600];
    $payloadB64 = rtrim(strtr(base64_encode(json_encode($payload)), '+/', '-_'), '=');
    $signature = hash_hmac('sha256', $payloadB64, ADMIN_TOKEN_SECRET);
    return $payloadB64 . '.' . $signature;
}

function require_admin() {
    $authHeader = get_auth_header();
    if (!preg_match('/^Bearer\s+(.+)$/', $authHeader, $m)) return false;

    $parts = explode('.', $m[1]);
    if (count($parts) !== 2) return false;
    [$payloadB64, $signature] = $parts;

    $expected = hash_hmac('sha256', $payloadB64, ADMIN_TOKEN_SECRET);
    if (!hash_equals($expected, $signature)) return false;

    $payload = json_decode(base64_decode(strtr($payloadB64, '-_', '+/')), true);
    if (!$payload || ($payload['exp'] ?? 0) < time()) return false;

    return ($payload['role'] ?? '') === 'admin';
}

function read_json_body() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}
