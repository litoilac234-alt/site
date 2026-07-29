<?php
declare(strict_types=1);

namespace Peo;

use Dompdf\Dompdf;
use Dompdf\Options;

class PdfReportService
{
    public function generateFromHtml(string $html, string $outputPath): string
    {
        $dir = dirname($outputPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $root = realpath(dirname(__DIR__, 2)) ?: dirname(__DIR__, 2);

        $options = new Options();
        $options->set('isRemoteEnabled', true);
        $options->set('isHtml5ParserEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');
        $options->set('chroot', $root);

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();
        file_put_contents($outputPath, $dompdf->output());

        return $outputPath;
    }
}
