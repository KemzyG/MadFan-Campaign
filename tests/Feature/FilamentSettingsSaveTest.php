<?php

use App\Filament\Resources\Settings\Pages\ManageSettings;
use App\Support\ApplicationSettings;
use Database\Seeders\SettingSeeder;
use Livewire\Livewire;

test('filament settings save without changes has no validation errors', function () {
    $admin = createSuperAdminUser();
    $this->seed(SettingSeeder::class);

    $this->actingAs($admin);

    Livewire::test(ManageSettings::class)
        ->call('save')
        ->assertHasNoErrors();
});

test('filament settings save can disable social verification', function () {
    $admin = createSuperAdminUser();
    $this->seed(SettingSeeder::class);

    ApplicationSettings::sync(['social_verification_required' => 'true']);

    $this->actingAs($admin);

    Livewire::test(ManageSettings::class)
        ->set('data.social_verification_required', false)
        ->call('save')
        ->assertHasNoErrors();

    expect(ApplicationSettings::socialVerificationRequired())->toBeFalse();
});

test('filament settings save preserves other settings when only social verification changes', function () {
    $admin = createSuperAdminUser();
    $this->seed(SettingSeeder::class);

    ApplicationSettings::sync([
        'social_verification_required' => 'true',
        'referral_bonus_points' => '900',
    ]);

    $this->actingAs($admin);

    Livewire::test(ManageSettings::class)
        ->set('data.social_verification_required', false)
        ->call('save')
        ->assertHasNoErrors();

    expect(ApplicationSettings::socialVerificationRequired())->toBeFalse()
        ->and(ApplicationSettings::referralBonusPoints())->toBe(900);
});

test('stored mail driver outside select options is normalized for display', function () {
    ApplicationSettings::sync(['mail_mailer' => 'array']);

    expect(ApplicationSettings::get('mail_mailer'))->toBe('array');
});
