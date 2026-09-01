<?php

namespace App\Http\Controllers\Api\Social;

use App\Enums\SocialReportStatus;
use App\Enums\SocialReportTarget;
use App\Http\Controllers\Controller;
use App\Http\Requests\Social\StoreSocialReportRequest;
use App\Models\Message;
use App\Models\SocialReport;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class ChatMessageReportController extends Controller
{
    public function store(StoreSocialReportRequest $request, Message $message): JsonResponse
    {
        $this->authorize('view', $message);

        /** @var User $reporter */
        $reporter = $request->user();

        SocialReport::query()->firstOrCreate(
            [
                'reporter_id' => $reporter->id,
                'target_type' => SocialReportTarget::Message,
                'target_id' => $message->id,
            ],
            [
                'reason' => $request->validated('reason'),
                'notes' => $request->validated('notes'),
                'status' => SocialReportStatus::Open,
            ],
        );

        return response()->json([
            'message' => 'Report submitted. Our team will review it.',
        ], 201);
    }
}
