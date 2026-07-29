<?php
declare(strict_types=1);

namespace Peo;

class WorkItemCalculator
{
    public static function compute(array $items, float $advancePayment = 0): array
    {
        $totalContract = 0.0;
        foreach ($items as $item) {
            $totalContract += (float)($item['unitPrice'] ?? 0) * (float)($item['programmedQty'] ?? 0);
        }

        $computed = [];
        foreach ($items as $item) {
            $unitPrice = (float)($item['unitPrice'] ?? 0);
            $programmedQty = (float)($item['programmedQty'] ?? 0);
            $previous = (float)($item['previous'] ?? 0);
            $thisPeriod = (float)($item['thisPeriod'] ?? 0);

            $contractAmount = $unitPrice * $programmedQty;
            $weightPct = $totalContract > 0 ? ($contractAmount / $totalContract) * 100 : 0;
            $toDate = $previous + $thisPeriod;
            $accomplishmentWeightPct = $programmedQty > 0 ? ($toDate / $programmedQty) * $weightPct : 0;
            $pctComplete = $programmedQty > 0 ? ($toDate / $programmedQty) * 100 : 0;
            $status = $item['remarks'] ?? ($pctComplete >= 100 ? 'COMPLETED' : ($pctComplete > 0 ? 'ON GOING' : ''));

            $computed[] = array_merge($item, [
                'contractAmount' => round($contractAmount, 2),
                'weightPct' => round($weightPct, 2),
                'toDate' => round($toDate, 2),
                'accomplishmentWeightPct' => round($accomplishmentWeightPct, 2),
                'status' => $status,
            ]);
        }

        $totalToDateWeightPct = array_sum(array_column($computed, 'accomplishmentWeightPct'));
        $totalThisAccomplishment = 0.0;
        foreach ($computed as $row) {
            $totalThisAccomplishment += (float)$row['thisPeriod'] * (float)$row['unitPrice'];
        }
        $pctThisAccomplishment = $totalContract > 0 ? ($totalThisAccomplishment / $totalContract) * 100 : 0;

        return [
            'items' => $computed,
            'totals' => [
                'totalContractAmount' => round($totalContract, 2),
                'totalWeightPct' => round(array_sum(array_column($computed, 'weightPct')), 2),
                'totalToDateWeightPct' => round($totalToDateWeightPct, 2),
                'pctThisAccomplishment' => round($pctThisAccomplishment, 2),
                'totalThisAccomplishment' => round($totalThisAccomplishment, 2),
                'totalVoucher' => round($totalThisAccomplishment - $advancePayment, 2),
            ],
        ];
    }

    public static function formatMoney(float $n): string
    {
        return number_format($n, 2, '.', ',');
    }
}
