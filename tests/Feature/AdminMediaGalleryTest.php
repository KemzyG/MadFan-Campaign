<?php

use App\Enums\AdminPermission;
use App\Enums\JerseySize;
use App\Enums\MediaAssetSource;
use App\Models\Club;
use App\Models\Jersey;
use App\Models\JerseyVariant;
use App\Models\MediaAsset;
use App\Support\CloudinaryImageStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;

beforeEach(function (): void {
    CloudinaryImageStorage::fakeReset();
    Storage::fake('public');
});

function fakeMediaUpload(string $name = 'kit.png'): UploadedFile
{
    $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');

    return UploadedFile::fake()->createWithContent($name, $png);
}

test('admins can open the media gallery page', function () {
    $admin = createAdminUser();
    $admin->givePermissionTo(Permission::findOrCreate(AdminPermission::MediaManage->value, 'web'));

    MediaAsset::factory()->count(2)->create();

    $this->actingAs($admin)
        ->get(route('admin.media'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Media/Index')
            ->has('assets.data', 2)
            ->where('cloudinary.configured', false));
});

test('admins can upload a media asset with local disk fallback', function () {
    $admin = createAdminUser();
    $admin->givePermissionTo(Permission::findOrCreate(AdminPermission::MediaManage->value, 'web'));

    $file = fakeMediaUpload('kit.jpg');

    $this->actingAs($admin)
        ->postJson(route('admin.api.media-assets.store'), [
            'title' => 'Home kit front',
            'alt_text' => 'Front view',
            'image' => $file,
        ])
        ->assertCreated()
        ->assertJsonPath('asset.title', 'Home kit front')
        ->assertJsonPath('asset.source', MediaAssetSource::Upload->value)
        ->assertJsonPath('storage', 'local');

    $asset = MediaAsset::query()->first();

    expect($asset)->not->toBeNull()
        ->and($asset->cloudinary_public_id)->toBeNull()
        ->and(Storage::disk('public')->exists($asset->path))->toBeTrue();
});

test('admins can update and delete media assets', function () {
    $admin = createAdminUser();
    $admin->givePermissionTo(Permission::findOrCreate(AdminPermission::MediaManage->value, 'web'));

    $asset = MediaAsset::factory()->create([
        'title' => 'Old title',
        'path' => 'media/old.jpg',
    ]);
    Storage::disk('public')->put('media/old.jpg', 'fake');

    $this->actingAs($admin)
        ->putJson(route('admin.api.media-assets.update', $asset), [
            'title' => 'New title',
            'alt_text' => 'Updated alt',
        ])
        ->assertSuccessful()
        ->assertJsonPath('asset.title', 'New title');

    $this->actingAs($admin)
        ->deleteJson(route('admin.api.media-assets.destroy', $asset))
        ->assertSuccessful();

    expect(MediaAsset::query()->find($asset->id))->toBeNull();
});

test('support staff without media permission cannot manage the gallery', function () {
    $support = createSupportAdmin();

    $this->actingAs($support)
        ->get(route('admin.media'))
        ->assertForbidden();

    $this->actingAs($support)
        ->postJson(route('admin.api.media-assets.store'), [
            'image' => fakeMediaUpload('x.png'),
        ])
        ->assertForbidden();
});

test('admins can attach gallery assets to a jersey', function () {
    $admin = createAdminUser();
    $admin->givePermissionTo(Permission::findOrCreate(AdminPermission::MediaManage->value, 'web'));
    $club = Club::factory()->create();
    $assets = MediaAsset::factory()->count(2)->create();

    $this->actingAs($admin)
        ->postJson(route('admin.api.jerseys.store'), [
            'club_id' => $club->id,
            'name' => 'Gallery Kit',
            'price' => '79.99',
            'is_active' => true,
            'sync_gallery' => true,
            'media_asset_ids' => $assets->pluck('id')->all(),
            'variants' => [
                ['size' => JerseySize::M->value, 'stock' => 5],
            ],
        ])
        ->assertCreated()
        ->assertJsonCount(2, 'media_assets');

    $jersey = Jersey::query()->where('name', 'Gallery Kit')->first();

    expect($jersey->mediaAssets)->toHaveCount(2);
});

test('shop product detail exposes attached gallery images', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);
    $jersey = Jersey::factory()->create([
        'club_id' => $club->id,
        'name' => 'Gallery Away',
        'slug' => 'gallery-away',
        'is_active' => true,
    ]);
    JerseyVariant::factory()->size(JerseySize::L)->create([
        'jersey_id' => $jersey->id,
        'stock' => 3,
    ]);

    $assets = MediaAsset::factory()->remote()->count(2)->create();
    $jersey->mediaAssets()->sync([
        $assets[0]->id => ['sort_order' => 0],
        $assets[1]->id => ['sort_order' => 1],
    ]);

    $this->actingAs($user)
        ->get(route('social.shop.show', $jersey))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Shop/Show')
            ->has('jersey.images', 2)
            ->where('jersey.images.0.url', $assets[0]->url));
});

test('shop catalog supports club filter and price sort', function () {
    $clubA = Club::factory()->create(['name' => 'Alpha FC']);
    $clubB = Club::factory()->create(['name' => 'Beta United']);
    $user = socialReadyUser($clubA);

    $cheap = Jersey::factory()->create([
        'club_id' => $clubA->id,
        'name' => 'Cheap Kit',
        'price' => '39.99',
        'is_active' => true,
    ]);
    JerseyVariant::factory()->create(['jersey_id' => $cheap->id, 'stock' => 2]);

    $pricey = Jersey::factory()->create([
        'club_id' => $clubA->id,
        'name' => 'Pricey Kit',
        'price' => '99.99',
        'is_active' => true,
    ]);
    JerseyVariant::factory()->create(['jersey_id' => $pricey->id, 'stock' => 2]);

    $other = Jersey::factory()->create([
        'club_id' => $clubB->id,
        'name' => 'Other Club Kit',
        'price' => '49.99',
        'is_active' => true,
    ]);
    JerseyVariant::factory()->create(['jersey_id' => $other->id, 'stock' => 2]);

    $this->actingAs($user)
        ->get(route('social.shop.index', [
            'club_id' => $clubA->id,
            'sort' => 'price_desc',
        ]))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Shop/Index')
            ->has('jerseys', 2)
            ->where('jerseys.0.name', 'Pricey Kit')
            ->where('jerseys.1.name', 'Cheap Kit')
            ->where('filters.sort', 'price_desc'));
});
