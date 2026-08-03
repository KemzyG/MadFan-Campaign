<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class BrandLogoStorage
{
    public static function store(UploadedFile $file, string $directory): string
    {
        return $file->store($directory, 'public');
    }

    public static function delete(?string $path): void
    {
        if (! $path) {
            return;
        }

        Storage::disk('public')->delete($path);
    }

    public static function replace(?string $existingPath, UploadedFile $file, string $directory): string
    {
        $path = self::store($file, $directory);
        self::delete($existingPath);

        return $path;
    }
}
