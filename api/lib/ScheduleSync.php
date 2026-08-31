<?php
declare(strict_types=1);

namespace Peo;

use PDO;

class ScheduleSync
{
    /** @param array<int, array<string, mixed>> $scheduledActivities Activities with es/ef from PdmSchedule */
    /** @param array<string, int|null> $actualEndByName */
    public static function barChartFromPdm(array $scheduledActivities, array $actualEndByName = []): array
    {
        $tasks = [];
        $i = 1;
        foreach ($scheduledActivities as $a) {
            $es = (int)($a['es'] ?? 0);
            $ef = (int)($a['ef'] ?? $es + (int)($a['duration'] ?? 1));
            $name = (string)($a['name'] ?? $a['number'] ?? 'Activity');
            $tasks[] = [
                'index' => $i++,
                'name' => $name,
                'startDay' => $es + 1,
                'endDay' => max($es + 1, $ef),
                'actualEndDay' => $actualEndByName[$name] ?? null,
                'isCritical' => !empty($a['isCritical']),
            ];
        }
        return $tasks;
    }

    /** Target S-curve from contractor reference milestones (WT% cumulative by day). */
    public static function sCurveFromReferenceTargets(
        string $startDate,
        int $projectDuration,
        array $preservedActual = [],
        ?array $milestones = null,
    ): array {
        $milestones = $milestones ?? RoadProjectReference::targetCumulativeByDay();
        $startTs = strtotime($startDate) ?: time();
        $duration = max(1, $projectDuration);
        $points = [];

        $startKey = date('Y-m-d', $startTs);
        $points[$startKey] = [
            'point_date' => $startKey,
            'original_plan_pct' => 0.0,
            'current_plan_pct' => 0.0,
            'actual_pct' => $preservedActual[$startKey] ?? null,
            'label' => 'Project start',
        ];

        foreach ($milestones as $day => $pct) {
            $dayNum = (int)$day;
            if ($dayNum <= 0 || $dayNum > $duration) {
                continue;
            }
            $dateKey = date('Y-m-d', strtotime("+{$dayNum} days", $startTs));
            $pctVal = round(min(100.0, (float)$pct), 3);
            $points[$dateKey] = [
                'point_date' => $dateKey,
                'original_plan_pct' => $pctVal,
                'current_plan_pct' => $pctVal,
                'actual_pct' => $preservedActual[$dateKey] ?? null,
                'label' => 'Day ' . $dayNum,
            ];
        }

        $endKey = date('Y-m-d', strtotime("+{$duration} days", $startTs));
        $points[$endKey] = [
            'point_date' => $endKey,
            'original_plan_pct' => 100.0,
            'current_plan_pct' => 100.0,
            'actual_pct' => $preservedActual[$endKey] ?? ($points[$endKey]['actual_pct'] ?? null),
            'label' => 'Project end',
        ];

        foreach ($preservedActual as $dateKey => $val) {
            if ($val === null) {
                continue;
            }
            if (isset($points[$dateKey])) {
                $points[$dateKey]['actual_pct'] = (float)$val;
            } else {
                $points[$dateKey] = [
                    'point_date' => $dateKey,
                    'original_plan_pct' => null,
                    'current_plan_pct' => null,
                    'actual_pct' => (float)$val,
                    'label' => 'Actual (report)',
                ];
            }
        }

        ksort($points);
        return array_values($points);
    }

    /** @param array<int, array<string, mixed>> $scheduledActivities */
    /** @param array<string, float|null> $preservedActual keyed by Y-m-d */
    public static function sCurveFromPdm(
        array $scheduledActivities,
        string $startDate,
        int $projectDuration,
        array $preservedActual = [],
    ): array {
        if ($scheduledActivities === []) {
            return [];
        }

        $totalDur = array_sum(array_map(fn($a) => (int)($a['duration'] ?? 0), $scheduledActivities)) ?: 1;
        $startTs = strtotime($startDate) ?: time();
        $duration = max(1, $projectDuration);
        $points = [];

        $startKey = date('Y-m-d', $startTs);
        $points[$startKey] = [
            'point_date' => $startKey,
            'original_plan_pct' => 0.0,
            'current_plan_pct' => 0.0,
            'actual_pct' => $preservedActual[$startKey] ?? null,
            'label' => 'Project start',
        ];

        $sorted = $scheduledActivities;
        usort($sorted, static function (array $a, array $b): int {
            $ef = ((int)($a['ef'] ?? 0)) <=> ((int)($b['ef'] ?? 0));
            return $ef !== 0 ? $ef : strcmp((string)($a['number'] ?? ''), (string)($b['number'] ?? ''));
        });

        $done = 0;
        foreach ($sorted as $a) {
            $done += (int)($a['duration'] ?? 0);
            $ef = max(0, (int)($a['ef'] ?? 0));
            $pct = round(min(100.0, ($done / $totalDur) * 100), 2);
            $dateKey = date('Y-m-d', strtotime("+{$ef} days", $startTs));
            $name = (string)($a['name'] ?? $a['number'] ?? 'Activity');
            $points[$dateKey] = [
                'point_date' => $dateKey,
                'original_plan_pct' => $pct,
                'current_plan_pct' => $pct,
                'actual_pct' => $preservedActual[$dateKey] ?? null,
                'label' => trim((string)($a['number'] ?? '') . ' — ' . $name, ' —'),
            ];
        }

        $endKey = date('Y-m-d', strtotime("+{$duration} days", $startTs));
        $points[$endKey] = [
            'point_date' => $endKey,
            'original_plan_pct' => 100.0,
            'current_plan_pct' => 100.0,
            'actual_pct' => $preservedActual[$endKey] ?? ($points[$endKey]['actual_pct'] ?? null),
            'label' => 'Project end',
        ];

        // Merge in any actual-progress dates (e.g. weekly SWA/STEWA/IAR entries) that do
        // not line up with a planned point so they still appear on the S-curve.
        foreach ($preservedActual as $dateKey => $val) {
            if ($val === null) {
                continue;
            }
            if (isset($points[$dateKey])) {
                $points[$dateKey]['actual_pct'] = (float)$val;
            } else {
                $points[$dateKey] = [
                    'point_date' => $dateKey,
                    'original_plan_pct' => null,
                    'current_plan_pct' => null,
                    'actual_pct' => (float)$val,
                    'label' => 'Actual (report)',
                ];
            }
        }

        $ordered = array_values($points);
        usort($ordered, static fn(array $a, array $b) => strcmp($a['point_date'], $b['point_date']));

        return self::forwardFillActualPoints($ordered, $preservedActual);
    }

    /**
     * Carry the latest reported actual % forward so the S-curve line reflects SWA/STEWA/IAR
     * progress between report dates.
     *
     * @param array<int, array<string, mixed>> $points
     * @param array<string, float> $reportActuals
     * @return array<int, array<string, mixed>>
     */
    public static function forwardFillActualPoints(array $points, array $reportActuals): array
    {
        if ($reportActuals === []) {
            return $points;
        }

        ksort($reportActuals);
        $reportDates = array_keys($reportActuals);
        $idx = 0;
        $latest = null;
        foreach ($points as &$point) {
            $dateKey = (string)($point['point_date'] ?? '');
            while ($idx < count($reportDates) && $reportDates[$idx] <= $dateKey) {
                $latest = (float)$reportActuals[$reportDates[$idx]];
                $idx++;
            }
            if ($latest !== null) {
                $point['actual_pct'] = $latest;
            }
        }
        unset($point);

        return $points;
    }

    /**
     * @return array{tasks: array<int, array<string, mixed>>, timeNow: int, latestPercent: float|null, latestReportDate: string|null}
     */
    public static function applyReportProgressToBarChart(
        array $barChartTasks,
        array $reportActuals,
        string $projectStartDate,
        int $totalDays,
        int $defaultTimeNow = 10,
    ): array {
        $timeNow = max(1, min($totalDays, $defaultTimeNow));
        $latestPercent = null;
        $latestReportDate = null;

        if ($reportActuals === []) {
            // First schedule entry is Target Plan only — no Time Now and no delay colors.
            foreach ($barChartTasks as &$task) {
                $task['actualEndDay'] = null;
            }
            unset($task);

            return [
                'tasks' => $barChartTasks,
                'timeNow' => 0,
                'latestPercent' => null,
                'latestReportDate' => null,
            ];
        }

        $startTs = strtotime($projectStartDate) ?: time();
        $latestDate = array_key_last($reportActuals);
        $latestPercent = (float)$reportActuals[$latestDate];
        $latestReportDate = (string)$latestDate;
        $latestTs = strtotime($latestReportDate) ?: $startTs;
        $elapsed = (int)floor(($latestTs - $startTs) / 86400) + 1;
        $timeNow = min(max(1, $elapsed), max(1, $totalDays));

        $achievedDays = (int)round(($latestPercent / 100) * max(1, $totalDays));
        foreach ($barChartTasks as &$task) {
            if (($task['actualEndDay'] ?? null) === null && (int)$task['endDay'] <= $achievedDays) {
                $task['actualEndDay'] = (int)$task['endDay'];
            }
        }
        unset($task);

        return [
            'tasks' => $barChartTasks,
            'timeNow' => $timeNow,
            'latestPercent' => $latestPercent,
            'latestReportDate' => $latestReportDate,
        ];
    }

    /**
     * Parse report period / week fields into Y-m-d (week start when ISO week is used).
     */
    public static function parseReportDate(mixed $raw, string $fallbackCreatedAt = ''): ?string
    {
        $value = trim((string)$raw);
        if ($value === '') {
            $value = trim($fallbackCreatedAt);
        }
        if ($value === '') {
            return null;
        }

        if (preg_match('/^(\d{4})-W(\d{1,2})$/i', $value, $m)) {
            $dt = new \DateTimeImmutable('now');
            $dt = $dt->setISODate((int)$m[1], (int)$m[2]);
            return $dt->format('Y-m-d');
        }

        $ts = strtotime($value);
        if ($ts !== false) {
            return date('Y-m-d', $ts);
        }

        if ($fallbackCreatedAt !== '') {
            $fallbackTs = strtotime($fallbackCreatedAt);
            if ($fallbackTs !== false) {
                return date('Y-m-d', $fallbackTs);
            }
        }

        return null;
    }

    /**
     * @return list<array{reportNumber:string,reportType:string,date:string,percent:float,label:string,status:string}>
     */
    public static function reportProgressEntries(PDO $pdo, int $projectId): array
    {
        try {
            $stmt = $pdo->prepare(
                "SELECT report_number, report_type, report_data, line_items, status, created_at
                 FROM swa_stewa_reports
                 WHERE project_id = ?
                   AND report_type IN ('SWA', 'STEWA', 'IAR')
                   AND status NOT IN ('draft', 'rejected', 'pending_contractor')
                 ORDER BY created_at ASC, id ASC"
            );
            $stmt->execute([$projectId]);
            $rows = $stmt->fetchAll();
        } catch (\Throwable) {
            return [];
        }

        $entries = [];
        foreach ($rows as $row) {
            $data = json_decode((string)($row['report_data'] ?? '{}'), true);
            if (!is_array($data)) {
                $data = [];
            }

            $date = self::parseReportDate(
                $data['report_date']
                    ?? $data['period_covered']
                    ?? $data['week_covered']
                    ?? $data['period']
                    ?? null,
                (string)$row['created_at'],
            );
            if ($date === null) {
                continue;
            }

            $pct = self::progressPercentFromReport(
                (string)$row['report_type'],
                $data,
                $row['line_items'] ?? null,
            );
            if ($pct === null) {
                continue;
            }

            $type = (string)$row['report_type'];
            $entries[] = [
                'reportNumber' => (string)$row['report_number'],
                'reportType' => $type,
                'date' => $date,
                'percent' => $pct,
                'label' => trim($type . ' · ' . (string)$row['report_number']),
                'status' => (string)$row['status'],
            ];
        }

        usort($entries, static fn(array $a, array $b) => [$a['date'], $a['reportNumber']] <=> [$b['date'], $b['reportNumber']]);
        return $entries;
    }

    /**
     * Actual progress points derived from SWA, STEWA, and IAR reports for a project,
     * keyed by Y-m-d date. Later reports on the same date override earlier ones.
     * This lets the S-curve and bar chart update automatically as weekly reports
     * are added, without manual data entry.
     *
     * @return array<string, float>
     */
    public static function actualPointsFromReports(PDO $pdo, int $projectId): array
    {
        $out = [];
        foreach (self::reportProgressEntries($pdo, $projectId) as $entry) {
            $out[$entry['date']] = $entry['percent'];
        }
        return $out;
    }

    /**
     * Extract overall % complete from a report payload.
     * SWA uses work-item weighted accomplishment; STEWA/IAR use percent fields.
     */
    public static function progressPercentFromReport(
        string $reportType,
        array $data,
        mixed $lineItemsRaw = null,
    ): ?float {
        $pct = null;

        if ($reportType === 'STEWA') {
            $pct = $data['percent_actual'] ?? $data['percent_complete'] ?? null;
        } elseif ($reportType === 'IAR') {
            $pct = $data['actual_progress']
                ?? $data['percent_actual']
                ?? $data['percent_complete']
                ?? $data['rev_target']
                ?? null;
        } elseif ($reportType === 'SWA') {
            $totals = $data['computed_totals'] ?? null;
            if (is_array($totals) && isset($totals['totalToDateWeightPct'])) {
                $pct = $totals['totalToDateWeightPct'];
            } else {
                $pct = $data['percent_actual'] ?? $data['percent_complete'] ?? null;
            }

            if (($pct === null || $pct === '') && $lineItemsRaw !== null) {
                $items = is_array($lineItemsRaw)
                    ? $lineItemsRaw
                    : (json_decode((string)$lineItemsRaw, true) ?: []);
                if (is_array($items) && $items !== []) {
                    try {
                        $calc = WorkItemCalculator::compute(
                            $items,
                            (float)($data['advance_payment'] ?? 0),
                        );
                        $pct = $calc['totals']['totalToDateWeightPct'] ?? null;
                    } catch (\Throwable) {
                        $pct = null;
                    }
                }
            }
        }

        if ($pct === null || $pct === '') {
            return null;
        }

        if (is_string($pct)) {
            $pct = str_replace(['%', ','], ['', ''], trim($pct));
        }

        if (!is_numeric($pct)) {
            return null;
        }

        return round(max(0.0, min(100.0, (float)$pct)), 2);
    }

    /** @param array<int, array<string, mixed>> $scheduledActivities */
    public static function sCurveActivitiesFromPdm(array $scheduledActivities, string $startDate): array
    {
        if ($scheduledActivities === []) {
            return [];
        }

        $totalDur = array_sum(array_map(fn($a) => (int)($a['duration'] ?? 0), $scheduledActivities)) ?: 1;
        $startTs = strtotime($startDate) ?: time();
        $sorted = $scheduledActivities;
        usort($sorted, static function (array $a, array $b): int {
            $ef = ((int)($a['ef'] ?? 0)) <=> ((int)($b['ef'] ?? 0));
            return $ef !== 0 ? $ef : strcmp((string)($a['number'] ?? ''), (string)($b['number'] ?? ''));
        });

        $done = 0;
        $rows = [];
        foreach ($sorted as $a) {
            $done += (int)($a['duration'] ?? 0);
            $ef = max(0, (int)($a['ef'] ?? 0));
            $es = max(0, (int)($a['es'] ?? 0));
            $rows[] = [
                'number' => (string)($a['number'] ?? ''),
                'name' => (string)($a['name'] ?? ''),
                'duration' => (int)($a['duration'] ?? 0),
                'es' => $es,
                'ef' => $ef,
                'finish_date' => date('Y-m-d', strtotime("+{$ef} days", $startTs)),
                'planned_pct' => round(min(100.0, ($done / $totalDur) * 100), 2),
                'is_critical' => !empty($a['isCritical']),
            ];
        }

        return $rows;
    }

    public static function loadPdmResult(PDO $pdo, int $projectId): array
    {
        $acts = $pdo->prepare(
            'SELECT id, activity_number AS number, activity_name AS name, duration, es_override
             FROM pdm_activities WHERE project_id = ? ORDER BY id'
        );
        $acts->execute([$projectId]);
        $activities = [];
        foreach ($acts->fetchAll() as $row) {
            $activities[] = [
                'id' => (string)$row['id'],
                'number' => $row['number'],
                'name' => $row['name'],
                'duration' => (int)$row['duration'],
                'esOverride' => $row['es_override'] !== null ? (int)$row['es_override'] : null,
            ];
        }

        $deps = $pdo->prepare(
            'SELECT from_activity_id AS fromId, to_activity_id AS toId, dependency_type AS type, lag_days AS `lag`
             FROM pdm_dependencies WHERE project_id = ?'
        );
        $deps->execute([$projectId]);
        $dependencies = [];
        foreach ($deps->fetchAll() as $row) {
            $dependencies[] = [
                'fromId' => (string)$row['fromId'],
                'toId' => (string)$row['toId'],
                'type' => $row['type'],
                'lag' => (int)$row['lag'],
            ];
        }

        return self::calculateScheduled($activities, $dependencies);
    }

    public static function projectStartDate(PDO $pdo, int $projectId): string
    {
        $stmt = $pdo->prepare('SELECT start_date FROM projects WHERE id = ?');
        $stmt->execute([$projectId]);
        $row = $stmt->fetchColumn();
        return $row ? (string)$row : date('Y-m-d');
    }

    /** @return array<string, float|null> */
    public static function loadPreservedActuals(PDO $pdo, int $projectId): array
    {
        $stmt = $pdo->prepare(
            'SELECT point_date, actual_pct FROM s_curve_points WHERE project_id = ? AND actual_pct IS NOT NULL'
        );
        $stmt->execute([$projectId]);
        $map = [];
        foreach ($stmt->fetchAll() as $row) {
            $map[(string)$row['point_date']] = $row['actual_pct'] !== null ? (float)$row['actual_pct'] : null;
        }
        return $map;
    }

    public static function saveSCurvePoints(PDO $pdo, int $projectId, array $points): void
    {
        $pdo->prepare('DELETE FROM s_curve_points WHERE project_id = ?')->execute([$projectId]);
        $ins = $pdo->prepare(
            'INSERT INTO s_curve_points (project_id, point_date, original_plan_pct, current_plan_pct, actual_pct)
             VALUES (?, ?, ?, ?, ?)'
        );
        foreach ($points as $p) {
            $ins->execute([
                $projectId,
                $p['point_date'],
                $p['original_plan_pct'],
                $p['current_plan_pct'],
                $p['actual_pct'],
            ]);
        }
    }

    /** @param array<int, array<string, mixed>> $activities */
    /** @param array<int, array<string, mixed>> $dependencies */
    public static function calculateScheduled(array $activities, array $dependencies): array
    {
        if ($activities === []) {
            return ['activities' => [], 'projectDuration' => 0, 'criticalPath' => []];
        }
        $pdm = PdmSchedule::calculate($activities, $dependencies);
        if (isset($pdm['error'])) {
            return ['activities' => $activities, 'projectDuration' => 0, 'criticalPath' => [], 'error' => $pdm['error']];
        }
        return $pdm;
    }

    public static function syncDerivedViews(PDO $pdo, int $projectId, array $pdmResult, array $actualEndByName = []): void
    {
        $scheduled = $pdmResult['activities'] ?? [];
        $duration = max(1, (int)($pdmResult['projectDuration'] ?? 0));
        $preserved = self::loadPreservedActuals($pdo, $projectId);
        $reportActuals = self::actualPointsFromReports($pdo, $projectId);
        $actuals = $reportActuals + $preserved;
        $startDate = self::projectStartDate($pdo, $projectId);
        if ($scheduled !== [] && self::isReferenceProject($pdo, $projectId)) {
            $points = self::sCurveFromReferenceTargets($startDate, $duration, $actuals);
        } else {
            $points = self::sCurveFromPdm($scheduled, $startDate, $duration, $actuals);
        }
        self::saveSCurvePoints($pdo, $projectId, $points);
    }

    public static function isReferenceProject(PDO $pdo, int $projectId): bool
    {
        $stmt = $pdo->prepare('SELECT name FROM projects WHERE id = ?');
        $stmt->execute([$projectId]);
        $name = (string)($stmt->fetchColumn() ?: '');
        return str_contains($name, 'Remebella')
            || str_contains($name, 'Concreting of Barangay Road');
    }
}
