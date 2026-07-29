<?php
declare(strict_types=1);

/**
 * One-time DB setup for Railway.
 * Open: https://YOUR-APP.up.railway.app/api/setup_db.php
 * Then delete this file or keep it — it skips if users table already exists.
 */

require __DIR__ . '/config.php';

header('Content-Type: text/plain; charset=utf-8');

try {
    $pdo = db();

    $exists = $pdo->query("SHOW TABLES LIKE 'users'")->fetch();
    if ($exists) {
        echo "OK: tables already exist. Nothing to do.\n";
        exit;
    }

    $sqlFile = dirname(__DIR__) . '/database/install-railway.sql';
    if (!is_readable($sqlFile)) {
        http_response_code(500);
        echo "ERROR: database/install-railway.sql not found in the container.\n";
        exit;
    }

    $sql = file_get_contents($sqlFile);
    // Strip comments
    $sql = preg_replace('/^--.*$/m', '', $sql);
    $statements = array_filter(array_map('trim', explode(';', $sql)));

    $pdo->exec('SET FOREIGN_KEY_CHECKS=0');
    foreach ($statements as $statement) {
        if ($statement === '') {
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
