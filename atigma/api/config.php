<?php
/**
 * Database connection settings.
 *
 * On shared hosting (cPanel etc.), create a MySQL database and a database
 * user from your hosting dashboard, then fill in the values below.
 * You'll usually see these exact fields in phpMyAdmin's "Users" tab too.
 *
 * For local testing with XAMPP/MAMP, the defaults below (localhost, root,
 * no password) usually work as-is once you've created the "atigma"
 * database and imported db/schema.sql through phpMyAdmin.
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'atigma');
define('DB_USER', 'root');
define('DB_PASS', '');

// Any long random string — used to sign admin login tokens.
// Generate one with: php -r "echo bin2hex(random_bytes(32));"
define('ADMIN_TOKEN_SECRET', 'change-this-to-a-long-random-string');

function get_pdo() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Could not connect to the database. Check api/config.php.']);
            exit;
        }
    }
    return $pdo;
}
