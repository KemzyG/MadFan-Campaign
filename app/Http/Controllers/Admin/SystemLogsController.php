<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Gate;

class SystemLogsController extends Controller
{
    private const LOG_PATH = 'storage/logs/laravel.log';

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewSystemLogs');
        $logFile = base_path(self::LOG_PATH);

        if (! File::exists($logFile)) {
            return response()->json(['lines' => [], 'size' => 0]);
        }

        $lines = (int) ($request->lines ?? 200);
        $content = $this->tailFile($logFile, $lines);
        $parsed = $this->parseLogLines($content);

        return response()->json([
            'lines' => $parsed,
            'size' => File::size($logFile),
            'last_modified' => date('Y-m-d H:i:s', File::lastModified($logFile)),
        ]);
    }

    public function clear(): JsonResponse
    {
        Gate::authorize('clearSystemLogs');
        $logFile = base_path(self::LOG_PATH);

        if (File::exists($logFile)) {
            File::put($logFile, '');
        }

        return response()->json(['message' => 'Log file cleared.']);
    }

    private function tailFile(string $file, int $lines): array
    {
        $handle = fopen($file, 'r');
        $buffer = [];
        $lineCount = 0;

        fseek($handle, 0, SEEK_END);
        $fileSize = ftell($handle);
        $chunkSize = 4096;
        $leftover = '';

        while ($fileSize > 0 && $lineCount < $lines) {
            $offset = max(0, $fileSize - $chunkSize);
            fseek($handle, $offset);
            $chunk = fread($handle, min($chunkSize, $fileSize));
            $fileSize -= $chunkSize;
            $lines_in_chunk = explode("\n", $chunk.$leftover);
            $leftover = array_shift($lines_in_chunk);

            foreach (array_reverse($lines_in_chunk) as $line) {
                if ($lineCount >= $lines) {
                    break;
                }
                $buffer[] = $line;
                $lineCount++;
            }
        }

        fclose($handle);

        return array_reverse($buffer);
    }

    private function parseLogLines(array $lines): array
    {
        $parsed = [];
        $pattern = '/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (\w+)\.(\w+): (.+)/';

        foreach ($lines as $line) {
            if (empty(trim($line))) {
                continue;
            }

            if (preg_match($pattern, $line, $matches)) {
                $parsed[] = [
                    'timestamp' => $matches[1],
                    'environment' => $matches[2],
                    'level' => strtolower($matches[3]),
                    'message' => $matches[4],
                    'raw' => $line,
                ];
            } else {
                // Continuation / stack trace line
                if (! empty($parsed)) {
                    $parsed[count($parsed) - 1]['raw'] .= "\n".$line;
                }
            }
        }

        return $parsed;
    }
}
