<?php

namespace Database\Factories;

use App\Enums\SocialReportStatus;
use App\Enums\SocialReportTarget;
use App\Models\SocialReport;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SocialReport>
 */
class SocialReportFactory extends Factory
{
    protected $model = SocialReport::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'reporter_id' => User::factory(),
            'target_type' => SocialReportTarget::Post,
            'target_id' => 1,
            'reason' => 'spam',
            'notes' => null,
            'status' => SocialReportStatus::Open,
            'assigned_to' => null,
        ];
    }
}
