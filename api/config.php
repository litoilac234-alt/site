<?php
declare(strict_types=1);

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/**
 * Read an environment variable with a local/XAMPP fallback.
 */
function env(string $key, string $default = ''): string
{
    $value = getenv($key);
    if ($value === false || $value === '') {
        $value = $_ENV[$key] ?? $_SERVER[$key] ?? '';
    }
    return ($value === false || $value === '') ? $default : (string)$value;
}

// Cloud MySQL uses MYSQL*; local XAMPP defaults kept for easy local runs.
define('DB_HOST', env('MYSQLHOST', env('DB_HOST', 'localhost')));
define('DB_PORT', env('MYSQLPORT', env('DB_PORT', '3306')));
define('DB_NAME', env('MYSQLDATABASE', env('DB_NAME', 'peo_monitoring')));
define('DB_USER', env('MYSQLUSER', env('DB_USER', 'root')));
define('DB_PASS', env('MYSQLPASSWORD', env('DB_PASS', '')));

// Public app URL (no trailing slash).
$defaultAppUrl = 'http://localhost/site';
if (env('RENDER_EXTERNAL_URL') !== '') {
    $defaultAppUrl = env('RENDER_EXTERNAL_URL');
} elseif (env('RAILWAY_PUBLIC_DOMAIN') !== '') {
    $defaultAppUrl = 'https://' . env('RAILWAY_PUBLIC_DOMAIN');
}
define('APP_URL', rtrim(env('APP_URL', $defaultAppUrl), '/'));
define('APP_BASE_PATH', env('APP_BASE_PATH', str_ends_with(APP_URL, '/site') ? '/site/' : '/'));
define('MAIL_FROM', env('MAIL_FROM', 'peo-monitoring@cagayan.gov.ph'));

if (session_status() === PHP_SESSION_NONE) {
    session_start([
        'cookie_path' => APP_BASE_PATH,
        'cookie_httponly' => true,
        'cookie_samesite' => 'Lax',
        'cookie_secure' => str_starts_with(APP_URL, 'https://'),
    ]);
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            DB_HOST,
            DB_PORT,
            DB_NAME
        );
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ];
        $useSsl = in_array(strtolower(env('MYSQL_SSL', '')), ['1', 'true', 'yes'], true);
        if ($useSsl) {
            // TiDB Serverless and other cloud MySQL providers
            $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
        }
        $pdo = new PDO(
            $dsn,
            DB_USER,
            DB_PASS,
            $options
        );
    }
    return $pdo;
}

function jsonResponse(mixed $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function jsonError(string $message, int $code = 400): void
{
    jsonResponse(['error' => $message], $code);
}

function readJsonBody(): array
{
    $raw = file_get_contents('php://input');
    return $raw ? (json_decode($raw, true) ?? []) : [];
}
