<?php
declare(strict_types=1);

namespace Peo;

/**
 * PDM training reference — Activities A–J (50-day project, critical path A→C→G→I→J).
 */
class RoadPdmSample
{
    public const PROJECT_TITLE = 'PDM Training Reference (Activities A–J)';

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
            'planned_end_date' => '2026-02-19',
            'duration_days' => 50,
        ];
    }

    /** @return list<array{key:string,number:string,name:string,duration:int,es_override?:int}> */
    public static function activities(): array
    {
        return [
            ['key' => 'a', 'number' => 'A', 'name' => 'Activity A', 'duration' => 10, 'es_override' => 1],
            ['key' => 'b', 'number' => 'B', 'name' => 'Activity B', 'duration' => 5],
            ['key' => 'c', 'number' => 'C', 'name' => 'Activity C', 'duration' => 15],
            ['key' => 'd', 'number' => 'D', 'name' => 'Activity D', 'duration' => 5],
            ['key' => 'e', 'number' => 'E', 'name' => 'Activity E', 'duration' => 20],
            ['key' => 'f', 'number' => 'F', 'name' => 'Activity F', 'duration' => 15],
            ['key' => 'g', 'number' => 'G', 'name' => 'Activity G', 'duration' => 10],
            ['key' => 'h', 'number' => 'H', 'name' => 'Activity H', 'duration' => 5],
            ['key' => 'i', 'number' => 'I', 'name' => 'Activity I', 'duration' => 10],
            ['key' => 'j', 'number' => 'J', 'name' => 'Activity J', 'duration' => 5],
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
            $fs('a', 'c'),
            $fs('a', 'd'),
            $fs('b', 'e'),
            $fs('b', 'f'),
            $fs('c', 'g'),
            $fs('d', 'h'),
            $fs('f', 'i'),
            $fs('g', 'i'),
            $fs('e', 'j'),
            $fs('i', 'j'),
            $fs('h', 'j'),
        ];
    }
}
