<?php

use App\Actions\Social\AwardSocialPoints;
use App\Models\Club;
use App\Models\Passport;
use App\Models\PointTransaction;
use App\Models\Season;
use App\Support\ApplicationSettings;
use Database\Seeders\SeasonSeeder;

test('social passport requires authentication and onboarding gates', function () {
    $this->get('/social/passport')->assertRedirect(route('login'));
});

test('social passport shows loyalty identity club brand and referral qr payload', function () {
    $this->seed(SeasonSeeder::class);

    $club = Club::factory()->create(['name' => 'Passport FC']);
    $user = socialReadyUser($club);
    $user->forceFill(['country' => 'ENG'])->save();

    $this->actingAs($user)
        ->post('/social/posts', ['body' => 'Writing the passport'])
        ->assertRedirect(route('social.feed'));

    $user->refresh();

    expect((int) $user->total_points)->toBe(AwardSocialPoints::RULES[AwardSocialPoints::SOURCE_POST]['points']);

    $passport = Passport::query()->where('user_id', $user->id)->first();
    expect($passport)->not->toBeNull()
        ->and((int) $passport->snapshot_points)->toBe((int) $user->total_points)
        ->and($passport->snapshot_club)->toBe('Passport FC');

    $season = Season::query()->find($passport->season_id);
    $socialPoints = AwardSocialPoints::RULES[AwardSocialPoints::SOURCE_POST]['points'];
    $expectedQr = $passport->referral_link ?: url('/r/'.$user->fan_id);

    $this->actingAs($user)
        ->get(route('social.passport'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Passport')
            ->where('identity.name', $user->name)
            ->where('identity.club.name', 'Passport FC')
            ->where('identity.country', 'ENG')
            ->where('identity.member_no', $user->fan_id)
            ->where('identity.fan_id', $user->fan_id)
            ->has('passport.issued_at')
            ->where('passport.qr_payload', $expectedQr)
            ->where('passport.referral_link', $expectedQr)
            ->where('loyalty.points', $user->total_points)
            ->where('loyalty.social_points_earned', $socialPoints)
            ->where('loyalty.campaign_points', max(0, (int) $user->total_points - $socialPoints))
            ->has('loyalty.best_streak_days')
            ->where('records.posts', 1)
            ->where('records.referrals', (int) $user->referral_count)
            ->where('records.engagements', 1)
            ->where('club_contribution.club_name', 'Passport FC')
            ->where('club_contribution.social_points', $socialPoints)
            ->where('club_contribution.posts', 1)
            ->where('season.id', $season?->id)
            ->where('season.code', $season?->code)
            ->has('passport.updated_at')
            ->where('brand.logo_url', asset('favicon.jpg'))
            ->where('brand.name', config('app.name')));

    expect(PointTransaction::query()
        ->where('user_id', $user->id)
        ->where('source_type', AwardSocialPoints::SOURCE_POST)
        ->exists())->toBeTrue();
});

test('club onboarding syncs passport snapshot allegiance', function () {
    $this->seed(SeasonSeeder::class);

    ApplicationSettings::sync(['social_network_enabled' => 'true']);

    $club = Club::factory()->create(['name' => 'Onboard United']);
    $user = createUser(['email_verified_at' => now()]);

    $this->actingAs($user)
        ->post('/social/onboarding/club', ['club_id' => $club->id])
        ->assertRedirect(route('social.home'));

    $passport = Passport::query()->where('user_id', $user->id)->first();

    expect($passport)->not->toBeNull()
        ->and($passport->snapshot_club)->toBe('Onboard United')
        ->and($passport->snapshot_name)->toBe($user->fresh()->name);
});
