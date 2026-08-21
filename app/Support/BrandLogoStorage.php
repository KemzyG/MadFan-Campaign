<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;

class BrandLogoStorage
{
    public static function store(UploadedFile $file, string $directory): string
    {
        return CloudinaryImageStorage::store($file, $directory);
    }

    public static function delete(?string $path): void
    {
        CloudinaryImageStorage::delete($path);
    }

    public static function replace(?string $existingPath, UploadedFile $file, string $directory): string
    {
        return CloudinaryImageStorage::replace($existingPath, $file, $directory);
    }
}
