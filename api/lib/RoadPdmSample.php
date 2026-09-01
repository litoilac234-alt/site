<?php
declare(strict_types=1);

namespace Peo;

/**
 * PDM reference data — cleared; awaiting new reference from user.
 */
class RoadPdmSample
{
    public const PROJECT_TITLE = 'PEO Monitoring Project';

    public static function hasReference(): bool
    {
        return self::activities() !== [];
    }

    /** @return list<array{key:string,number:string,name:string,duration:int,es_override?:int}> */
    public static function activities(): array
    {
        return [];
    }

    /** @return list<array{from:string,to:string,type:string,lag:int}> */
    public static function dependencies(): array
    {
        return [];
    }
}
