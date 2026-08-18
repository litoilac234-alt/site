<?php
declare(strict_types=1);

namespace Peo;

/**
 * Sample PDM from a DPWH-style road concreting inspection network (110 calendar days).
 */
class RoadPdmSample
{
    /** @return list<array{key:string,number:string,name:string,duration:int}> */
    public static function activities(): array
    {
        return [
            ['key' => 'b5', 'number' => 'B.5', 'name' => 'Project Billboard', 'duration' => 1],
            ['key' => 'a111', 'number' => 'A.1.1(11)', 'name' => 'Provision of Furnitures/Fixtures, etc. for the Field Office for the Engineer', 'duration' => 10],
            ['key' => 'b9', 'number' => 'B.9', 'name' => 'Mobilization / Demobilization', 'duration' => 10],
            ['key' => 'b7', 'number' => 'B.7', 'name' => 'Construction Safety & Health Program', 'duration' => 110],
            ['key' => 'r1013', 'number' => '101(3)b3', 'name' => 'Removal of Actual Structures/Obstructions, 0.23m thk. PCCP (Unreinforced)', 'duration' => 5],
            ['key' => 'r1014', 'number' => '101(4)a1', 'name' => 'Removal of Actual Structures/Obstructions, 610mm dia. RCPC', 'duration' => 3],
            ['key' => 'r404a', 'number' => '404(1)a', 'name' => 'Reinforcing Steel, Grade 40', 'duration' => 1],
            ['key' => 'r404b', 'number' => '404(1)b', 'name' => 'Reinforcing Steel, Grade 60', 'duration' => 1],
            ['key' => 'r500', 'number' => '500(1)a3', 'name' => 'Reinforced Concrete Pipe Culvert, 910mm dia. Class IV', 'duration' => 3],
            ['key' => 'r405c', 'number' => '405(1)a3', 'name' => 'Structural Concrete Class A, 20.68MPa @ 28 days', 'duration' => 1],
            ['key' => 'e1041', 'number' => '104(1)a', 'name' => 'Embankment from Roadway Excavation (Common Soil)', 'duration' => 15],
            ['key' => 'e1042', 'number' => '104(2)a', 'name' => 'Embankment (From Borrow, Common Soil)', 'duration' => 10],
            ['key' => 'e103', 'number' => '103(1)a', 'name' => 'Structure Excavation (Common Soil)', 'duration' => 15],
            ['key' => 'e105', 'number' => '105(1)', 'name' => 'Sub-Grade Preparation (Common Material)', 'duration' => 3],
            ['key' => 'e200', 'number' => '200(1)', 'name' => 'Aggregate Sub-Base Course', 'duration' => 15],
            ['key' => 'p311u', 'number' => '311(1)c1', 'name' => 'Portland Cement Concrete Pavement (Unreinforced), 0.23m thk. 14 days', 'duration' => 30],
            ['key' => 'r404a2', 'number' => '404(1)a', 'name' => 'Reinforcing Steel Grade 40', 'duration' => 30],
            ['key' => 'r404b2', 'number' => '404(1)b', 'name' => 'Reinforcing Steel Grade 60', 'duration' => 20],
            ['key' => 'r405p', 'number' => '405(1)a3', 'name' => 'Structural Concrete Class A, 20.68MPa @ 28 days', 'duration' => 30],
            ['key' => 'p311r', 'number' => '311(2)e1', 'name' => 'Portland Cement Concrete Pavement (Reinforced), 0.28m thk. 14 days', 'duration' => 1],
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
            $fs('b9', 'r1013'),
            $fs('r1013', 'r1014'),
            $fs('r1014', 'r404a'),
            $fs('r1014', 'r404b'),
            $fs('r404a', 'r500'),
            $fs('r404a', 'r404a2'),
            $fs('r500', 'r405c'),
            $fs('r405c', 'e1041'),
            $fs('e1041', 'e1042', -1),
            $fs('e1042', 'e103'),
            $fs('e1042', 'r404b2'),
            $fs('e103', 'e105'),
            $fs('e105', 'e200'),
            $fs('e200', 'p311u'),
            $fs('r404a2', 'r404b2'),
            $fs('r404b2', 'r405p'),
            $fs('r405p', 'p311r', 10),
        ];
    }
}
