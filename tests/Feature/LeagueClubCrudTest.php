<?php

use App\Models\Club;
use App\Models\League;
use Database\Seeders\AdminPermissionsSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(AdminPermissionsSeeder::class);
    Storage::fake('public');
});

function fakeLogoUpload(string $name = 'logo.png'): UploadedFile
{
    $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');

    return UploadedFile::fake()->createWithContent($name, $png);
}

test('admin can manage leagues via inertia and api', function () {
    $admin = createAdminUser();

    $this->actingAs($admin)
        ->get('/ops/leagues')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('Admin/Leagues/Index'));

    $response = $this->actingAs($admin)->post('/ops/api/leagues', [
        'name' => 'Premier League',
        'short' => 'EPL',
        'logo' => fakeLogoUpload('epl.png'),
    ]);

    $response->assertCreated()
        ->assertJsonPath('name', 'Premier League')
        ->assertJsonPath('short', 'EPL');

    $league = League::query()->where('short', 'EPL')->first();
    expect($league)->not->toBeNull()
        ->and($league->logo)->not->toBeNull();

    Storage::disk('public')->assertExists($league->logo);

    $this->actingAs($admin)
        ->post("/ops/api/leagues/{$league->id}", [
            '_method' => 'PUT',
            'name' => 'English Premier League',
            'short' => 'EPL',
        ])
        ->assertSuccessful()
        ->assertJsonPath('name', 'English Premier League');

    $this->actingAs($admin)
        ->delete("/ops/api/leagues/{$league->id}")
        ->assertSuccessful();

    expect(League::query()->whereKey($league->id)->exists())->toBeFalse();
});

test('admin can manage clubs related to a league', function () {
    $admin = createAdminUser();
    $league = League::factory()->create(['name' => 'La Liga', 'short' => 'LL']);

    $this->actingAs($admin)
        ->get('/ops/clubs')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Clubs/Index')
            ->has('leagues', 1));

    $this->actingAs($admin)
        ->post('/ops/api/clubs', [
            'league_id' => $league->id,
            'name' => 'Real Madrid',
            'short' => 'RMA',
            'logo' => fakeLogoUpload('rma.png'),
        ])
        ->assertCreated()
        ->assertJsonPath('name', 'Real Madrid')
        ->assertJsonPath('league_id', $league->id)
        ->assertJsonPath('league.short', 'LL');

    $club = Club::query()->where('short', 'RMA')->first();
    expect($club)->not->toBeNull()
        ->and($club->league_id)->toBe($league->id);

    $this->actingAs($admin)
        ->post("/ops/api/clubs/{$club->id}", [
            '_method' => 'PUT',
            'name' => 'Real Madrid CF',
            'short' => 'RMA',
            'league_id' => $league->id,
        ])
        ->assertSuccessful()
        ->assertJsonPath('name', 'Real Madrid CF');

    $this->actingAs($admin)
        ->get('/ops/clubs?league_id='.$league->id)
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Clubs/Index')
            ->has('clubs.data', 1)
            ->where('filters.league_id', $league->id));

    $this->actingAs($admin)
        ->delete("/ops/api/clubs/{$club->id}")
        ->assertSuccessful();

    expect(Club::query()->whereKey($club->id)->exists())->toBeFalse();
});

test('club short must be unique within a league', function () {
    $admin = createAdminUser();
    $league = League::factory()->create();
    Club::factory()->create([
        'league_id' => $league->id,
        'short' => 'ABC',
    ]);

    $this->actingAs($admin)
        ->postJson('/ops/api/clubs', [
            'league_id' => $league->id,
            'name' => 'Another Club',
            'short' => 'ABC',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['short']);
});

test('deleting a league cascades to its clubs', function () {
    $admin = createAdminUser();
    $league = League::factory()->create();
    $club = Club::factory()->create(['league_id' => $league->id]);

    $this->actingAs($admin)
        ->delete("/ops/api/leagues/{$league->id}")
        ->assertSuccessful();

    expect(Club::query()->whereKey($club->id)->exists())->toBeFalse();
});

test('regular users cannot manage leagues or clubs', function () {
    $user = createUser();

    $this->actingAs($user)->get('/ops/leagues')->assertForbidden();
    $this->actingAs($user)->get('/ops/clubs')->assertForbidden();
    $this->actingAs($user)->postJson('/ops/api/leagues', [
        'name' => 'Denied League',
        'short' => 'DNY',
    ])->assertForbidden();
});
