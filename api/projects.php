<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once dirname(__DIR__) . '/vendor/autoload.php';

use Peo\Auth;
use Peo\DatabaseSetup;

$pdo = db();
DatabaseSetup::ensureUsersAndProjects($pdo);
Auth::requireAuth();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'POST') {
    // Only Engineer I can create the project that serves as the basis for
    // the contractor's schedule.
    Auth::requireRoles(['engineer_1']);

    $body = readJsonBody();
    $name = trim((string)($body['name'] ?? ''));
    if ($name === '') {
        jsonError('Project title is required.');
    }

    $location = trim((string)($body['location'] ?? ''));
    $startDate = trim((string)($body['start_date'] ?? ''));
    $plannedEnd = trim((string)($body['planned_end_date'] ?? ''));

    $stmt = $pdo->prepare(
        'INSERT INTO projects (name, location, start_date, planned_end_date, status)
         VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $name,
        $location !== '' ? $location : null,
        $startDate !== '' ? $startDate : null,
        $plannedEnd !== '' ? $plannedEnd : null,
        'active',
    ]);

    $id = (int)$pdo->lastInsertId();
    $sel = $pdo->prepare(
        'SELECT id, name, location, status, start_date, planned_end_date FROM projects WHERE id = ?'
    );
    $sel->execute([$id]);
    $row = $sel->fetch();

    jsonResponse(['project' => $row], 201);
}

$rows = $pdo->query(
    'SELECT id, name, location, status, start_date, planned_end_date FROM projects ORDER BY name'
)->fetchAll();

jsonResponse(['projects' => $rows]);
