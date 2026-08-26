<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once dirname(__DIR__) . '/vendor/autoload.php';

use Peo\Auth;
use Peo\DatabaseSetup;
use Peo\ScheduleSync;

$pdo = db();
DatabaseSetup::ensureUsersAndProjects($pdo);
DatabaseSetup::ensureScheduleTables($pdo);
DatabaseSetup::ensureSCurveTable($pdo);
DatabaseSetup::seedScheduleIfEmpty($pdo);
DatabaseSetup::seedSCurveIfEmpty($pdo);

$method = $_SERVER['REQUEST_METHOD'];
$projectId = (int)($_GET['project_id'] ?? 1);

function formatScurvePoints(array $rawPoints): array
{
    $points = [];
    foreach ($rawPoints as $row) {
        $points[] = [
            'date' => date('M j', strtotime((string)$row['point_date'])),
            'pointDate' => (string)$row['point_date'],
            'label' => $row['label'] ?? null,
            'originalPlan' => $row['original_plan_pct'] !== null ? (float)$row['original_plan_pct'] : null,
            'currentPlan' => $row['current_plan_pct'] !== null ? (float)$row['current_plan_pct'] : null,
            'actual' => $row['actual_pct'] !== null ? (float)$row['actual_pct'] : null,
        ];
    }
    return $points;
}

if ($method === 'GET') {
    Auth::requireAuth();

    $pdm = ScheduleSync::loadPdmResult($pdo, $projectId);
    $scheduled = $pdm['activities'] ?? [];
    $duration = max(1, (int)($pdm['projectDuration'] ?? 0));
    $startDate = ScheduleSync::projectStartDate($pdo, $projectId);
    $preserved = ScheduleSync::loadPreservedActuals($pdo, $projectId);

    $reportFeed = ScheduleSync::reportProgressEntries($pdo, $projectId);
    $reportActuals = ScheduleSync::actualPointsFromReports($pdo, $projectId);
    $actuals = $reportActuals + $preserved;

    if ($scheduled !== []) {
        if (ScheduleSync::isReferenceProject($pdo, $projectId)) {
            $rawPoints = ScheduleSync::sCurveFromReferenceTargets($startDate, $duration, $actuals);
        } else {
            $rawPoints = ScheduleSync::sCurveFromPdm($scheduled, $startDate, $duration, $actuals);
        }
        $activities = ScheduleSync::sCurveActivitiesFromPdm($scheduled, $startDate);
    } else {
        $stmt = $pdo->prepare(
            'SELECT point_date, original_plan_pct, current_plan_pct, actual_pct
             FROM s_curve_points WHERE project_id = ? ORDER BY point_date'
        );
        $stmt->execute([$projectId]);
        $byDate = [];
        foreach ($stmt->fetchAll() as $row) {
            $byDate[(string)$row['point_date']] = [
                'point_date' => (string)$row['point_date'],
                'original_plan_pct' => $row['original_plan_pct'],
                'current_plan_pct' => $row['current_plan_pct'],
                'actual_pct' => $row['actual_pct'],
                'label' => null,
            ];
        }
        foreach ($reportActuals as $dateKey => $val) {
            if (isset($byDate[$dateKey])) {
                $byDate[$dateKey]['actual_pct'] = $val;
            } else {
                $byDate[$dateKey] = [
                    'point_date' => $dateKey,
                    'original_plan_pct' => null,
                    'current_plan_pct' => null,
                    'actual_pct' => $val,
                    'label' => 'Actual (report)',
                ];
            }
        }
        ksort($byDate);
        $rawPoints = array_values($byDate);
        $activities = [];
    }

    jsonResponse([
        'project_id' => $projectId,
        'project_duration' => $duration,
        'critical_path' => $pdm['criticalPath'] ?? [],
        'points' => formatScurvePoints($rawPoints),
        'activities' => $activities,
        'synced_from_pdm' => $scheduled !== [],
        'report_feed' => $reportFeed,
        'latest_report_percent' => $reportActuals !== [] ? (float)$reportActuals[array_key_last($reportActuals)] : null,
        'latest_report_date' => $reportActuals !== [] ? array_key_last($reportActuals) : null,
    ]);
}

if ($method === 'POST') {
    Auth::requireRoles(['engineer_1', 'engineer_2', 'engineer_3', 'engineer_4', 'contractor']);
    $body = readJsonBody();
    $projectId = (int)($body['project_id'] ?? 1);
    $points = $body['points'] ?? [];
    if (!is_array($points)) {
        jsonError('points array required');
    }

    $pdo->prepare('DELETE FROM s_curve_points WHERE project_id = ?')->execute([$projectId]);
    $ins = $pdo->prepare(
        'INSERT INTO s_curve_points (project_id, point_date, original_plan_pct, current_plan_pct, actual_pct)
         VALUES (?, ?, ?, ?, ?)'
    );
    foreach ($points as $p) {
        $date = (string)($p['point_date'] ?? $p['date'] ?? '');
        if ($date === '') {
            continue;
        }
        $ts = strtotime($date);
        if ($ts === false) {
            continue;
        }
        $ins->execute([
            $projectId,
            date('Y-m-d', $ts),
            $p['original_plan_pct'] ?? $p['originalPlan'] ?? null,
            $p['current_plan_pct'] ?? $p['currentPlan'] ?? null,
            $p['actual_pct'] ?? $p['actual'] ?? null,
        ]);
    }
    jsonResponse(['ok' => true]);
}

jsonError('Method not allowed', 405);
