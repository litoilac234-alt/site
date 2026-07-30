<?php
declare(strict_types=1);

namespace Peo;

class PdmSchedule
{
    /** @param array<int, array<string, mixed>> $activities */
    /** @param array<int, array<string, mixed>> $dependencies */
    public static function calculate(array $activities, array $dependencies): array
    {
        $map = [];
        foreach ($activities as $a) {
            $map[(string)$a['id']] = $a;
        }

        $preds = [];
        $succs = [];
        foreach ($dependencies as $dep) {
            $from = (string)$dep['fromId'];
            $to = (string)$dep['toId'];
            $preds[$to][] = $dep;
            $succs[$from][] = $dep;
        }

        $inDegree = array_fill_keys(array_keys($map), 0);
        $adj = array_fill_keys(array_keys($map), []);
        foreach ($dependencies as $dep) {
            $from = (string)$dep['fromId'];
            $to = (string)$dep['toId'];
            $adj[$from][] = $to;
            $inDegree[$to]++;
        }

        $queue = array_keys(array_filter($inDegree, fn($d) => $d === 0));
        $topo = [];
        while ($queue) {
            $id = array_shift($queue);
            $topo[] = $id;
            foreach ($adj[$id] ?? [] as $next) {
                $inDegree[$next]--;
                if ($inDegree[$next] === 0) {
                    $queue[] = $next;
                }
            }
        }

        if (count($topo) !== count($map)) {
            return ['error' => 'Circular dependency detected'];
        }

        if ($map === []) {
            return ['activities' => [], 'projectDuration' => 0, 'criticalPath' => []];
        }

        foreach ($topo as $id) {
            $incoming = $preds[$id] ?? [];
            $es = 0;
            foreach ($incoming as $dep) {
                $pred = $map[(string)$dep['fromId']];
                $lag = (int)($dep['lag'] ?? 0);
                $type = strtoupper((string)($dep['type'] ?? 'FS'));
                $es = max($es, match ($type) {
                    'FS' => (int)$pred['ef'] + $lag,
                    'SS' => (int)$pred['es'] + $lag,
                    'FF' => (int)$pred['ef'] + $lag - (int)$map[$id]['duration'],
                    'SF' => (int)$pred['es'] + $lag - (int)$map[$id]['duration'],
                    default => 0,
                });
            }
            $map[$id]['es'] = $es;
            $map[$id]['ef'] = $es + (int)$map[$id]['duration'];
        }

        $efValues = array_column($map, 'ef');
        $projectEnd = $efValues !== [] ? (int)max($efValues) : 0;

        foreach (array_reverse($topo) as $id) {
            $outgoing = $succs[$id] ?? [];
            $lf = $projectEnd;
            foreach ($outgoing as $dep) {
                $succ = $map[(string)$dep['toId']];
                $lag = (int)($dep['lag'] ?? 0);
                $type = strtoupper((string)($dep['type'] ?? 'FS'));
                $lf = min($lf, match ($type) {
                    'FS', 'SS' => (int)($succ['ls'] ?? $projectEnd) - $lag,
                    'FF' => (int)($succ['lf'] ?? $projectEnd) - $lag,
                    'SF' => (int)($succ['lf'] ?? $projectEnd) - $lag + (int)$map[$id]['duration'],
                    default => $projectEnd,
                });
            }
            $map[$id]['lf'] = $lf;
            $map[$id]['ls'] = $lf - (int)$map[$id]['duration'];
            $map[$id]['isCritical'] = $map[$id]['ls'] === $map[$id]['es'];
        }

        $critical = array_values(array_filter($map, fn($a) => !empty($a['isCritical'])));

        return [
            'activities' => array_values($map),
            'projectDuration' => $projectEnd,
            'criticalPath' => array_column($critical, 'number'),
        ];
    }
}
