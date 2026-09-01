<?php

use App\Models\Fandom;
use App\Models\FandomSubset;
use Database\Seeders\AdminPermissionsSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(AdminPermissionsSeeder::class);
    Storage::fake('public');
});

function fakeFandomImage(string $name = 'cover.png'): UploadedFile
{
    $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');

    return UploadedFile::fake()->createWithContent($name, $png);
}

test('admin can manage fandoms via inertia and api', function () {
    $admin = createAdminUser();

    $this->actingAs($admin)
        ->get('/ops/fandoms')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('Admin/Fandoms/Index'));

    $response = $this->actingAs($admin)->post('/ops/api/fandoms', [
        'name' => 'Esports Arena',
        'slug' => 'esports-arena',
        'description' => 'Competitive gaming fandom',
        'group' => 'esports',
        'icon' => '🎮',
        'is_active' => true,
        'cover_image' => fakeFandomImage('esports.png'),
    ]);

    $response->assertCreated()
        ->assertJsonPath('name', 'Esports Arena')
        ->assertJsonPath('slug', 'esports-arena')
        ->assertJsonPath('group', 'esports');

    $fandom = Fandom::query()->where('slug', 'esports-arena')->first();
    expect($fandom)->not->toBeNull();

    $this->actingAs($admin)
        ->get("/ops/fandoms/{$fandom->id}")
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Fandoms/Show')
            ->has('analytics.followers')
            ->where('fandom.id', $fandom->id));

    $this->actingAs($admin)
        ->putJson("/ops/api/fandoms/{$fandom->id}", [
            'name' => 'Esports Arena Pro',
            'is_active' => false,
        ])
        ->assertOk()
        ->assertJsonPath('name', 'Esports Arena Pro')
        ->assertJsonPath('is_active', false);

    $subset = $this->actingAs($admin)->post('/ops/api/fandoms/'.$fandom->id.'/subsets', [
        'name' => 'Valorant',
        'slug' => 'valorant',
        'fan_count' => 1200,
        'is_trending' => true,
        'sort_order' => 1,
        'image' => fakeFandomImage('valorant.png'),
    ]);

    $subset->assertCreated()->assertJsonPath('name', 'Valorant');

    $subsetModel = FandomSubset::query()->where('slug', 'valorant')->first();
    expect($subsetModel)->not->toBeNull()
        ->and($subsetModel->fandom_id)->toBe($fandom->id);

    $this->actingAs($admin)
        ->deleteJson("/ops/api/fandoms/{$fandom->id}/subsets/{$subsetModel->id}")
        ->assertOk();

    $this->actingAs($admin)
        ->deleteJson("/ops/api/fandoms/{$fandom->id}")
        ->assertOk();

    expect(Fandom::query()->find($fandom->id))->toBeNull();
});

test('support role cannot manage fandoms', function () {
    $support = createSupportAdmin();

    $this->actingAs($support)
        ->get('/ops/fandoms')
        ->assertForbidden();
});
