<?php

namespace App\Http\Controllers;

use App\Models\UserTaskProgress;
use App\Support\TaskProofStorage;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TaskProofImageController extends Controller
{
    public function show(UserTaskProgress $progress): StreamedResponse
    {
        $this->authorize('viewProof', $progress);

        $path = $progress->proof_image_path;
        $disk = TaskProofStorage::diskFor($path);

        abort_unless(filled($path) && filled($disk), 404);

        return Storage::disk($disk)->response($path, headers: [
            'Cache-Control' => 'private, no-store',
        ]);
    }
}
