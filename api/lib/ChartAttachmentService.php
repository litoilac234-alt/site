<?php
declare(strict_types=1);

namespace Peo;

/**
 * Builds optional S-Curve / PDM / Bar Chart PDF summaries for the IAR week
 * when Engineer II selects generate options before approve.
 */
class ChartAttachmentService
{
    /**
     * @param array{s_curve?:bool,pdm?:bool,bar_chart?:bool} $flags
     * @return list<array{label:string,path:string}> relative paths under site root
     */
    public static function generateSelected(PDO $pdo, array $report, array $flags): array
    {
        $projectId = (int)($report['project_id'] ?? 0);
        $reportNumber = (string)($report['report_number'] ?? 'report');
        $week = (string)(($report['report_data']['week_covered'] ?? '') ?: ($report['report_data']['report_date'] ?? ''));
        $projectName = (string)(
            $report['report_data']['project_title']
            ?? $report['report_data']['project_name']
            ?? 'Project'
        );
        $baseDir = dirname(__DIR__, 2) . '/storage/reports/' . preg_replace('/[^A-Za-z0-9._-]+/', '_', $reportNumber);
        if (!is_dir($baseDir)) {
            mkdir($baseDir, 0755, true);
        }

        $out = [];
        $pdf = new PdfReportService();

        if (!empty($flags['s_curve'])) {
            $html = self::sCurveHtml($pdo, $projectId, $projectName, $week, $reportNumber);
            $rel = 'storage/reports/' . basename($baseDir) . '/S-Curve.pdf';
            $pdf->generateFromHtml($html, dirname(__DIR__, 2) . '/' . $rel);
            $out[] = ['label' => 'S-Curve', 'path' => $rel];
        }
        if (!empty($flags['pdm'])) {
            $html = self::pdmHtml($pdo, $projectId, $projectName, $week, $reportNumber);
            $rel = 'storage/reports/' . basename($baseDir) . '/PDM.pdf';
            $pdf->generateFromHtml($html, dirname(__DIR__, 2) . '/' . $rel);
            $out[] = ['label' => 'PDM', 'path' => $rel];
        }
        if (!empty($flags['bar_chart'])) {
            $html = self::barChartHtml($pdo, $projectId, $projectName, $week, $reportNumber);
            $rel = 'storage/reports/' . basename($baseDir) . '/Bar-Chart.pdf';
            $pdf->generateFromHtml($html, dirname(__DIR__, 2) . '/' . $rel);
            $out[] = ['label' => 'Bar Chart', 'path' => $rel];
        }

        return $out;
    }

    private static function wrap(string $title, string $projectName, string $week, string $reportNumber, string $body): string
    {
        $p = htmlspecialchars($projectName);
        $w = htmlspecialchars($week !== '' ? $week : '—');
        $r = htmlspecialchars($reportNumber);
        $t = htmlspecialchars($title);
        return <<<HTML
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
body{font-family:DejaVu Sans,sans-serif;font-size:11px;color:#222;margin:24px}
h1{font-size:18px;margin:0 0 8px}
.meta{color:#555;margin-bottom:16px}
table{width:100%;border-collapse:collapse}
th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}
th{background:#f3f3f3}
</style></head><body>
<h1>{$t}</h1>
<div class="meta">Project: {$p}<br>IAR week: {$w}<br>Report: {$r}</div>
{$body}
</body></html>
HTML;
    }

    private static function sCurveHtml(PDO $pdo, int $projectId, string $projectName, string $week, string $reportNumber): string
    {
        $stmt = $pdo->prepare(
            'SELECT point_date, original_plan_pct, actual_pct FROM s_curve_points WHERE project_id = ? ORDER BY point_date'
        );
        $stmt->execute([$projectId]);
        $rows = $stmt->fetchAll();
        $body = '<table><thead><tr><th>Date</th><th>Target Plan %</th><th>Actual %</th></tr></thead><tbody>';
        if (!$rows) {
            $body .= '<tr><td colspan="3">No S-Curve data for this project yet.</td></tr>';
        } else {
            foreach ($rows as $row) {
                $body .= '<tr><td>' . htmlspecialchars((string)$row['point_date']) . '</td>'
                    . '<td>' . htmlspecialchars((string)($row['original_plan_pct'] ?? '—')) . '</td>'
                    . '<td>' . htmlspecialchars((string)($row['actual_pct'] ?? '—')) . '</td></tr>';
            }
        }
        $body .= '</tbody></table>';
        return self::wrap('S-Curve Progress Report', $projectName, $week, $reportNumber, $body);
    }

    private static function pdmHtml(PDO $pdo, int $projectId, string $projectName, string $week, string $reportNumber): string
    {
        $stmt = $pdo->prepare(
            'SELECT activity_number, activity_name, duration FROM pdm_activities WHERE project_id = ? ORDER BY id'
        );
        $stmt->execute([$projectId]);
        $rows = $stmt->fetchAll();
        $body = '<table><thead><tr><th>#</th><th>Activity</th><th>Duration (days)</th></tr></thead><tbody>';
        if (!$rows) {
            $body .= '<tr><td colspan="3">No PDM activities for this project yet.</td></tr>';
        } else {
            foreach ($rows as $row) {
                $body .= '<tr><td>' . htmlspecialchars((string)$row['activity_number']) . '</td>'
                    . '<td>' . htmlspecialchars((string)$row['activity_name']) . '</td>'
                    . '<td>' . htmlspecialchars((string)$row['duration']) . '</td></tr>';
            }
        }
        $body .= '</tbody></table>';
        return self::wrap('PDM Schedule Report', $projectName, $week, $reportNumber, $body);
    }

    private static function barChartHtml(PDO $pdo, int $projectId, string $projectName, string $week, string $reportNumber): string
    {
        $stmt = $pdo->prepare(
            'SELECT task_name, start_day, end_day, actual_end_day FROM bar_chart_tasks WHERE project_id = ? ORDER BY task_index'
        );
        $stmt->execute([$projectId]);
        $rows = $stmt->fetchAll();
        $body = '<table><thead><tr><th>Task</th><th>Start day</th><th>Target end</th><th>Actual end</th></tr></thead><tbody>';
        if (!$rows) {
            $body .= '<tr><td colspan="4">No Bar Chart tasks for this project yet.</td></tr>';
        } else {
            foreach ($rows as $row) {
                $body .= '<tr><td>' . htmlspecialchars((string)$row['task_name']) . '</td>'
                    . '<td>' . htmlspecialchars((string)$row['start_day']) . '</td>'
                    . '<td>' . htmlspecialchars((string)$row['end_day']) . '</td>'
                    . '<td>' . htmlspecialchars((string)($row['actual_end_day'] ?? '—')) . '</td></tr>';
            }
        }
        $body .= '</tbody></table>';
        return self::wrap('Bar Chart Progress Report', $projectName, $week, $reportNumber, $body);
    }
}
