<?php

namespace Database\Seeders;

use App\Enums\StageParticipantRole;
use App\Enums\StageStatus;
use App\Models\Stage;
use App\Models\StageParticipant;
use App\Models\User;
use App\Support\ApplicationSettings;
use Illuminate\Database\Seeder;

/**
 * Idempotent demo live Stage (also called from ProductionCoreSeeder after sports posts).
 * Skips when social is off, no onboarded fan exists, or a live Stage is already present.
 */
class StageSeeder extends Seeder
{
    public function run(): void
    {
        if (! ApplicationSettings::socialNetworkEnabled()) {
            $this->command?->warn('StageSeeder skipped: social network disabled.');

            return;
        }

        $host = User::query()
            ->whereNotNull('social_onboarded_at')
            ->whereNotNull('favourite_club_id')
            ->whereNotNull('email_verified_at')
            ->orderBy('id')
            ->first();

        if ($host === null) {
            $this->command?->warn('StageSeeder skipped: no social-ready user.');

            return;
        }

        if (Stage::query()->where('status', StageStatus::Live)->exists()) {
            $this->command?->info('StageSeeder: live Stage already exists.');

            return;
        }

        $stage = Stage::query()->create([
            'host_id' => $host->id,
            'club_id' => $host->favourite_club_id,
            'title' => 'Terrace warm-up - demo Stage',
            'status' => StageStatus::Live,
            'voice_enabled' => false,
            'started_at' => now(),
        ]);

        StageParticipant::query()->create([
            'stage_id' => $stage->id,
            'user_id' => $host->id,
            'role' => StageParticipantRole::Host,
            'is_muted' => true,
            'joined_at' => now(),
            'last_seen_at' => now(),
        ]);

        $this->command?->info("Demo Stage #{$stage->id} hosted by {$host->handle}.");
    }
}
