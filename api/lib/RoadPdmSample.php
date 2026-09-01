<?php
declare(strict_types=1);

namespace Peo;

/**
 * Precedence diagram sample — Activities A–F (Start → A→B→C and D→E→F, with D→C cross-link).
 */
class RoadPdmSample
{
    public const PROJECT_TITLE = 'Precedence Diagram Sample (Activities A–F)';

    public static function hasReference(): bool
    {
        return self::activities() !== [];
    }

    /** @return array{name:string,location:string,start_date:string,planned_end_date:string,duration_days:int}|null */
    public static function projectMeta(): ?array
    {
        if (!self::hasReference()) {
            return null;
        }

        return [
            'name' => self::PROJECT_TITLE,
            'location' => 'Training',
            'start_date' => '2026-01-01',
            'planned_end_date' => '2026-01-10',
            'duration_days' => 10,
        ];
    }

    /** @return list<array{key:string,number:string,name:string,duration:int,es_override?:int}> */
    public static function activities(): array
    {
        return [
            ['key' => 'a', 'number' => 'A', 'name' => 'Activity A', 'duration' => 3, 'es_override' => 1],
            ['key' => 'b', 'number' => 'B', 'name' => 'Activity B', 'duration' => 4],
            ['key' => 'c', 'number' => 'C', 'name' => 'Activity C', 'duration' => 2],
            ['key' => 'd', 'number' => 'D', 'name' => 'Activity D', 'duration' => 5, 'es_override' => 1],
            ['key' => 'e', 'number' => 'E', 'name' => 'Activity E', 'duration' => 2],
            ['key' => 'f', 'number' => 'F', 'name' => 'Activity F', 'duration' => 3],
        ];
    }

    /** @return list<array{from:string,to:string,type:string,lag:int}> */
    public static function dependencies(): array
    {
        $fs = static fn(string $from, string $to, int $lag = 0): array => [
            'from' => $from,
            'to' => $to,
            'type' => 'FS',
            'lag' => $lag,
        ];

        return [
            $fs('a', 'b'),
            $fs('b', 'c'),
            $fs('d', 'c'),
            $fs('d', 'e'),
            $fs('e', 'f'),
        ];
    }
}
