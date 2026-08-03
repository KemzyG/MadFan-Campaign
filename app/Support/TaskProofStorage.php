<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class TaskProofStorage
{
    public const DISK = 'local';

    /**
     * Legacy disk used before proofs were moved behind auth.
     */
    public const LEGACY_DISK = 'public';

    public static function store(UploadedFile $file, int $userId): string
    {
        return $file->store('task-proofs/'.$userId, self::DISK);
    }

    public static function delete(?string $path): void
    {
        if (! filled($path)) {
            return;
        }

        foreach ([self::DISK, self::LEGACY_DISK] as $disk) {
            if (Storage::disk($disk)->exists($path)) {
                Storage::disk($disk)->delete($path);
            }
        }
    }

    public static function diskFor(?string $path): ?string
    {
        if (! filled($path)) {
            return null;
        }

        if (Storage::disk(self::DISK)->exists($path)) {
            return self::DISK;
        }

        if (Storage::disk(self::LEGACY_DISK)->exists($path)) {
            return self::LEGACY_DISK;
        }

        return null;
    }
}
