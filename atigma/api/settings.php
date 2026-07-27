<?php
require_once __DIR__ . '/auth.php';

handle_preflight();
$pdo = get_pdo();
$method = $_SERVER['REQUEST_METHOD'];

// Maps the friendly field names the frontend uses to the DB setting_key.
$FIELD_MAP = [
    'email' => 'contact_email',
    'whatsapp' => 'whatsapp_number',
    'whatsappMsg' => 'whatsapp_message',
    'instagram' => 'instagram_url',
    'linkedin' => 'linkedin_url',
    'facebook' => 'facebook_url',
    'tiktok' => 'tiktok_url',
    'activeTheme' => 'active_theme',
    'founderPhoto' => 'founder_photo',
    'adminPasscode' => 'admin_passcode',
];

// ---------- GET: public settings (never send the passcode back) ----------
if ($method === 'GET') {
    $rows = $pdo->query('SELECT setting_key, setting_value FROM site_settings')->fetchAll();
    $byKey = [];
    foreach ($rows as $r) { $byKey[$r['setting_key']] = $r['setting_value']; }

    $settings = [];
    foreach ($FIELD_MAP as $friendly => $dbKey) {
        if ($friendly === 'adminPasscode') continue; // never expose this publicly
        $settings[$friendly] = $byKey[$dbKey] ?? '';
    }
    json_response(200, ['settings' => $settings]);
}

// ---------- PUT: update settings (admin only) ----------
if ($method === 'PUT') {
    if (!require_admin()) json_response(401, ['error' => 'Admin login required.']);

    $body = read_json_body();
    $stmt = $pdo->prepare(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?'
    );

    foreach ($body as $friendly => $value) {
        if (!isset($FIELD_MAP[$friendly])) continue;
        if ($friendly === 'adminPasscode') {
            if (!$value) continue; // don't blank the passcode by accident
            $value = password_hash($value, PASSWORD_DEFAULT); // always store hashed, never plain text
        }
        $dbKey = $FIELD_MAP[$friendly];
        $stmt->execute([$dbKey, $value, $value]);
    }

    json_response(200, ['success' => true]);
}

json_response(405, ['error' => 'Method not allowed']);
