<?php

namespace App\Support;

use Illuminate\Support\Facades\File;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;

/**
 * Copy storage/app/public → a web-root storage/ folder (no symlink / no SSH).
 */
class PublicStorageWebMirror
{
    /**
     * @return array{copied: int, destination: string}
     */
    public static function mirrorTo(string $webStorageDirectory): array
    {
        $source = storage_path('app/public');
        $destination = rtrim($webStorageDirectory, '/\\');

        File::ensureDirectoryExists($destination);

        $copied = 0;

        if (! is_dir($source)) {
            return ['copied' => 0, 'destination' => $destination];
        }

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($source, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST,
        );

        /** @var SplFileInfo $item */
        foreach ($iterator as $item) {
            $relative = substr($item->getPathname(), strlen($source) + 1);
            $target = $destination.DIRECTORY_SEPARATOR.$relative;

            if ($item->isDir()) {
                File::ensureDirectoryExists($target);

                continue;
            }

            File::ensureDirectoryExists(dirname($target));
            File::copy($item->getPathname(), $target);
            $copied++;
        }

        return ['copied' => $copied, 'destination' => $destination];
    }
}
