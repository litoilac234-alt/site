<?php
declare(strict_types=1);

/**
 * Auto DB install for Railway (CLI or browser).
 * Safe to run on every boot — skips if users table exists.
 */

require_once __DIR__ . '/lib/MysqlPdo.php';

$isCli = PHP_SAPI === 'cli';

if (!$isCli) {
    header('Content-Type: text/plain; charset=utf-8');
    header('X-Accel-Buffering: no');
}

ini_set('display_errors', '0');
ini_set('default_socket_timeout', '10');

function env_val(string $key, string $default = ''): string
{
    $value = getenv($key);
    if ($value === false || $value === '') {
        $value = $_ENV[$key] ?? $_SERVER[$key] ?? '';
    }
    return ($value === false || $value === '') ? $default : (string) $value;
}

function out(string $line): void
{
    echo $line . "\n";
    if (PHP_SAPI !== 'cli') {
        flush();
    }
}

$host = env_val('MYSQLHOST', env_val('DB_HOST', ''));
$port = env_val('MYSQLPORT', env_val('DB_PORT', '3306'));
$name = env_val('MYSQLDATABASE', env_val('DB_NAME', ''));
$user = env_val('MYSQLUSER', env_val('DB_USER', ''));
$pass = env_val('MYSQLPASSWORD', env_val('DB_PASS', ''));

$sslOn = mysql_ssl_enabled($host, env_val('MYSQL_SSL', ''));
out("DB setup: host={$host} db={$name} user={$user} ssl=" . ($sslOn ? 'on' : 'off'));

if ($host === '' || $name === '' || $user === '') {
    out('SKIP: MySQL env vars missing.');
    exit($isCli ? 0 : 1);
}

$pdo = null;
$lastError = '';
for ($attempt = 1; $attempt <= 10; $attempt++) {
    try {
        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $name);
        $options = mysql_pdo_options($host, env_val('MYSQL_SSL', ''));
        $pdo = new PDO($dsn, $user, $pass, $options);
        out("Connected (attempt {$attempt}).");
        break;
    } catch (Throwable $e) {
        $lastError = $e->getMessage();
        out("Waiting for MySQL (attempt {$attempt}/10): {$lastError}");
        sleep(3);
    }
}

if ($pdo === null) {
    out('ERROR: could not connect to MySQL: ' . $lastError);
    exit($isCli ? 0 : 1); // don't block boot forever
}

try {
    $exists = $pdo->query("SHOW TABLES LIKE 'users'")->fetch();
    if ($exists) {
        out('OK: tables already exist.');
        exit(0);
    }

    $sqlFile = dirname(__DIR__) . '/database/install-railway.sql';
    if (!is_readable($sqlFile)) {
        out('ERROR: database/install-railway.sql not found.');
        exit($isCli ? 0 : 1);
    }

    $sql = file_get_contents($sqlFile);
    $sql = preg_replace('/^--.*$/m', '', $sql ?? '');
    $statements = array_filter(array_map('trim', explode(';', (string) $sql)));

    $pdo->exec('SET FOREIGN_KEY_CHECKS=0');
    foreach ($statements as $statement) {
        if ($statement === '' || stripos($statement, 'SET FOREIGN_KEY_CHECKS') === 0) {
            continue;
        }
        $pdo->exec($statement);
    }
    $pdo->exec('SET FOREIGN_KEY_CHECKS=1');

    out('OK: database installed.');
    out('Login: engineer1@peo.local / demo123');
    exit(0);
} catch (Throwable $e) {
    out('ERROR: ' . $e->getMessage());
    exit($isCli ? 0 : 1);
}
