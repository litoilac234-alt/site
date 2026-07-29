<?php
declare(strict_types=1);

/**
 * One-time DB setup for Railway.
 * Open: https://YOUR-APP.up.railway.app/api/setup_db.php
 */

header('Content-Type: text/plain; charset=utf-8');
ini_set('display_errors', '0');

function env_val(string $key, string $default = ''): string
{
    $value = getenv($key);
    if ($value === false || $value === '') {
        $value = $_ENV[$key] ?? $_SERVER[$key] ?? '';
    }
    return ($value === false || $value === '') ? $default : (string) $value;
}

$host = env_val('MYSQLHOST', env_val('DB_HOST', ''));
$port = env_val('MYSQLPORT', env_val('DB_PORT', '3306'));
$name = env_val('MYSQLDATABASE', env_val('DB_NAME', ''));
$user = env_val('MYSQLUSER', env_val('DB_USER', ''));
$pass = env_val('MYSQLPASSWORD', env_val('DB_PASS', ''));

echo "Host={$host}\nPort={$port}\nDatabase={$name}\nUser={$user}\n\n";

if ($host === '' || $name === '' || $user === '') {
    http_response_code(500);
    echo "ERROR: MySQL env vars missing. Check site Variables in Railway.\n";
    exit;
}

try {
    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $name);
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    echo "Connected to MySQL.\n";

    $exists = $pdo->query("SHOW TABLES LIKE 'users'")->fetch();
    if ($exists) {
        echo "OK: tables already exist. Nothing to do.\n";
        exit;
    }

    $sqlFile = dirname(__DIR__) . '/database/install-railway.sql';
    if (!is_readable($sqlFile)) {
        http_response_code(500);
        echo "ERROR: database/install-railway.sql not found.\n";
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

    echo "OK: database installed successfully.\n";
    echo "Demo login: engineer1@peo.local / demo123\n";
} catch (Throwable $e) {
    http_response_code(500);
    echo 'ERROR: ' . $e->getMessage() . "\n";
}
