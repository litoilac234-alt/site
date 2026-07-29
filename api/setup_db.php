<?php
declare(strict_types=1);

header('Content-Type: text/plain; charset=utf-8');
header('X-Accel-Buffering: no');
ini_set('display_errors', '0');
ini_set('default_socket_timeout', '5');
while (ob_get_level() > 0) {
    ob_end_flush();
}
ob_implicit_flush(true);

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
    flush();
}

$host = env_val('MYSQLHOST', env_val('DB_HOST', ''));
$port = env_val('MYSQLPORT', env_val('DB_PORT', '3306'));
$name = env_val('MYSQLDATABASE', env_val('DB_NAME', ''));
$user = env_val('MYSQLUSER', env_val('DB_USER', ''));
$pass = env_val('MYSQLPASSWORD', env_val('DB_PASS', ''));

out("Host={$host}");
out("Port={$port}");
out("Database={$name}");
out("User={$user}");
out('');

if ($host === '' || $name === '' || $user === '') {
    http_response_code(500);
    out('ERROR: MySQL env vars missing. Check site Variables in Railway.');
    exit;
}

try {
    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $name);
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5,
        PDO::MYSQL_ATTR_CONNECT_TIMEOUT => 5,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    out('Connected to MySQL.');

    $exists = $pdo->query("SHOW TABLES LIKE 'users'")->fetch();
    if ($exists) {
        out('OK: tables already exist. Nothing to do.');
        exit;
    }

    $sqlFile = dirname(__DIR__) . '/database/install-railway.sql';
    if (!is_readable($sqlFile)) {
        http_response_code(500);
        out('ERROR: database/install-railway.sql not found.');
        exit;
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

    out('OK: database installed successfully.');
    out('Demo login: engineer1@peo.local / demo123');
} catch (Throwable $e) {
    http_response_code(500);
    out('ERROR: ' . $e->getMessage());
}
