<?php

use App\Models\AdminOrganization;
use App\Models\Club;
use App\Models\SocialAccount;
use App\Models\User;
use App\Services\Fan\FanPageDataService;
use App\Services\PasetoService;
use App\Support\ApplicationSettings;
use Database\Seeders\AdminPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

pest()->beforeEach(function (): void {
    app()[PermissionRegistrar::class]->forgetCachedPermissions();
})->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
*/

function seedRoles(): void
{
    (new AdminPermissionsSeeder)->run();
}

function createUser(array $attributes = []): User
{
    seedRoles();

    return User::factory()->create($attributes);
}

function createAdminUser(array $attributes = []): User
{
    seedRoles();

    $organization = AdminOrganization::query()->first()
        ?? AdminOrganization::factory()->create([
            'name' => 'Global Operations',
            'slug' => 'global-ops',
        ]);

    $user = User::factory()->admin()->create($attributes);
    $user->adminOrganizations()->syncWithoutDetaching([$organization->id]);
    $user->forceFill(['current_admin_organization_id' => $organization->id])->save();

    return $user->fresh(['roles', 'adminOrganizations']);
}

function createSuperAdminUser(array $attributes = []): User
{
    seedRoles();

    $user = User::factory()->create($attributes);
    $user->syncRoles(['super-admin']);

    return $user->fresh(['roles']);
}

function createOrgAdmin(
    ?AdminOrganization $organization = null,
    string $role = 'admin',
    array $attributes = [],
): User {
    seedRoles();

    $organization ??= AdminOrganization::factory()->create();

    $user = User::factory()->create($attributes);
    $user->syncRoles([$role]);
    $user->adminOrganizations()->attach($organization);
    $user->forceFill(['current_admin_organization_id' => $organization->id])->save();

    return $user->fresh(['roles', 'adminOrganizations']);
}

function connectRequiredSocialAccounts(User $user): User
{
    SocialAccount::factory()->x()->create(['user_id' => $user->id]);
    SocialAccount::factory()->discord()->create(['user_id' => $user->id]);

    return $user->fresh(['socialAccounts']);
}

function requireSocialConnections(): void
{
    ApplicationSettings::sync([
        'social_verification_required' => 'true',
    ]);
}

function createSupportAdmin(array $attributes = []): User
{
    $user = createAdminUser($attributes);
    $user->syncRoles(['support']);

    return $user->fresh(['roles']);
}

function validTestPassword(): string
{
    return 'Password123456';
}

function deviceFingerprint(string $seed = 'test-device'): string
{
    return hash('sha256', $seed);
}

function ensureRegistrationClub(string $name = 'Liverpool FC'): Club
{
    return Club::query()->where('name', $name)->first()
        ?? Club::factory()->create(['name' => $name]);
}

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function fanRegisterPayload(array $overrides = []): array
{
    $clubName = $overrides['club'] ?? 'Liverpool FC';

    if (
        (! array_key_exists('club', $overrides) || filled($clubName))
        && $clubName !== FanPageDataService::OTHER_CLUB
    ) {
        ensureRegistrationClub((string) $clubName);
    }

    return [
        'name' => 'Test Fan',
        'email' => 'fan-'.uniqid().'@madfan.test',
        'password' => validTestPassword(),
        'password_confirmation' => validTestPassword(),
        'club' => $clubName,
        'device_fingerprint' => deviceFingerprint('fp-'.uniqid('', true)),
        ...$overrides,
    ];
}

/**
 * @return array<string, string>
 */
function pasetoHeaders(User $user): array
{
    $token = app(PasetoService::class)->generateToken($user->id);

    return ['Authorization' => 'Bearer '.$token];
}
