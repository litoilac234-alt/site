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

            // Optional 0-based Early Start override (0 = first day).
            $override = $map[$id]['esOverride'] ?? $map[$id]['es_override'] ?? null;
            if ($override !== null && $override !== '') {
                $day = (int)$override;
                if ($day >= 0) {
                    $es = $day;
                    $map[$id]['esOverride'] = $day;
                }
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
            // Critical when total float is zero: (LF − EF) = 0 and (LS − ES) = 0.
            $es = (int)$map[$id]['es'];
            $ef = (int)$map[$id]['ef'];
            $ls = (int)$map[$id]['ls'];
            $lfVal = (int)$map[$id]['lf'];
            $map[$id]['isCritical'] = ($lfVal - $ef) === 0 && ($ls - $es) === 0;
        }

        $critical = array_values(array_filter($map, fn($a) => !empty($a['isCritical'])));
        usort($critical, static fn($a, $b) => ((int)($a['es'] ?? 0)) <=> ((int)($b['es'] ?? 0)));

        return [
            'activities' => array_values($map),
            'projectDuration' => $projectEnd,
            'criticalPath' => self::longestCriticalChain($map, $preds, $projectEnd),
        ];
    }

    /**
     * One continuous critical chain (paper style), not every zero-float parallel activity.
     *
     * @param array<string, array<string, mixed>> $map
     * @param array<string, list<array<string, mixed>>> $preds
     * @return list<string>
     */
    private static function longestCriticalChain(array $map, array $preds, int $projectEnd): array
    {
        $terminals = array_filter(
            $map,
            static fn(array $a): bool => !empty($a['isCritical']) && (int)($a['ef'] ?? 0) === $projectEnd,
        );
        if ($terminals === []) {
            return array_column(
                array_values(array_filter($map, static fn(array $a): bool => !empty($a['isCritical']))),
                'number',
            );
        }

        $best = [];
        foreach (array_keys($terminals) as $terminalId) {
            $chain = [];
            $id = (string)$terminalId;
            while (true) {
                $chain[] = $id;
                $criticalPreds = [];
                foreach ($preds[$id] ?? [] as $dep) {
                    $pid = (string)$dep['fromId'];
                    if (!empty($map[$pid]['isCritical'])) {
                        $criticalPreds[] = $dep;
                    }
                }
                if ($criticalPreds === []) {
                    break;
                }
                usort(
                    $criticalPreds,
                    static fn(array $a, array $b): int => ((int)($map[(string)$b['fromId']]['ef'] ?? 0))
                        <=> ((int)($map[(string)$a['fromId']]['ef'] ?? 0)),
                );
                $id = (string)$criticalPreds[0]['fromId'];
            }
            $chain = array_reverse($chain);
            if (count($chain) > count($best)) {
                $best = $chain;
            }
        }

        return array_map(static fn(string $id): string => (string)($map[$id]['number'] ?? ''), $best);
    }
}
