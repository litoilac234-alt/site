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

function projectPayloadFromBody(array $body): array
{
    $name = trim((string)($body['name'] ?? ''));
    if ($name === '') {
        jsonError('Project title is required.');
    }

    $location = trim((string)($body['location'] ?? ''));
    $startDate = trim((string)($body['start_date'] ?? ''));
    $plannedEnd = trim((string)($body['planned_end_date'] ?? ''));
    $status = trim((string)($body['status'] ?? 'active'));
    if ($status === '') {
        $status = 'active';
    }

    return [
        'name' => $name,
        'location' => $location !== '' ? $location : null,
        'start_date' => $startDate !== '' ? $startDate : null,
        'planned_end_date' => $plannedEnd !== '' ? $plannedEnd : null,
        'status' => $status,
    ];
}

function fetchProject(PDO $pdo, int $id): ?array
{
    $sel = $pdo->prepare(
        'SELECT id, name, location, status, start_date, planned_end_date FROM projects WHERE id = ?'
    );
    $sel->execute([$id]);
    $row = $sel->fetch();
    return $row ?: null;
}

if ($method === 'POST') {
    // Only Engineer I can create the project that serves as the basis for
    // the contractor's schedule.
    Auth::requireRoles(['engineer_1']);

    $body = readJsonBody();
    $payload = projectPayloadFromBody($body);

    $stmt = $pdo->prepare(
        'INSERT INTO projects (name, location, start_date, planned_end_date, status)
         VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $payload['name'],
        $payload['location'],
        $payload['start_date'],
        $payload['planned_end_date'],
        $payload['status'] ?: 'active',
    ]);

    $id = (int)$pdo->lastInsertId();
    $row = fetchProject($pdo, $id);
    jsonResponse(['project' => $row], 201);
}

if ($method === 'PUT' || $method === 'PATCH') {
    Auth::requireRoles(['engineer_1']);

    $body = readJsonBody();
    $id = (int)($body['id'] ?? $_GET['id'] ?? 0);
    if ($id <= 0) {
        jsonError('Project id is required.');
    }

    $existing = fetchProject($pdo, $id);
    if (!$existing) {
        jsonError('Project not found.', 404);
    }

    $payload = projectPayloadFromBody($body);

    $stmt = $pdo->prepare(
        'UPDATE projects
         SET name = ?, location = ?, start_date = ?, planned_end_date = ?, status = ?
         WHERE id = ?'
    );
    $stmt->execute([
        $payload['name'],
        $payload['location'],
        $payload['start_date'],
        $payload['planned_end_date'],
        $payload['status'] ?: ($existing['status'] ?? 'active'),
        $id,
    ]);

    $row = fetchProject($pdo, $id);
    jsonResponse(['project' => $row]);
}

$rows = $pdo->query(
    'SELECT id, name, location, status, start_date, planned_end_date FROM projects ORDER BY name'
)->fetchAll();

jsonResponse(['projects' => $rows]);
