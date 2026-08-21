<?php

use App\Enums\AdminPermission;
use App\Enums\MediaAssetSource;
use App\Models\MediaAsset;
use App\Support\CloudinaryImageGeneration;
use App\Support\CloudinaryImageStorage;
use Illuminate\Http\UploadedFile;
use Spatie\Permission\Models\Permission;

beforeEach(function (): void {
    CloudinaryImageStorage::fakeReset();
    CloudinaryImageGeneration::fakeReset();
});

test('generate endpoint returns a clear error when cloudinary is not configured', function () {
    $admin = createAdminUser();
    $admin->givePermissionTo(Permission::findOrCreate(AdminPermission::MediaManage->value, 'web'));

    $this->actingAs($admin)
        ->postJson(route('admin.api.media-assets.generate'), [
            'prompt' => 'A photorealistic football jersey on a studio stand',
        ])
        ->assertUnprocessable()
        ->assertJsonFragment([
            'message' => 'Cloudinary Image Generation is not configured. Set CLOUDINARY_URL (or cloud name + API key/secret) and enable the Image Generation add-on. Device uploads still work with a local disk fallback.',
        ]);

    expect(MediaAsset::query()->count())->toBe(0);
});

test('admins can generate a media asset when cloudinary generation is faked', function () {
    CloudinaryImageGeneration::fake();

    $admin = createAdminUser();
    $admin->givePermissionTo(Permission::findOrCreate(AdminPermission::MediaManage->value, 'web'));

    $this->actingAs($admin)
        ->postJson(route('admin.api.media-assets.generate'), [
            'prompt' => 'Navy and gold home kit flat lay, soft daylight product shot',
            'title' => 'AI home kit',
        ])
        ->assertCreated()
        ->assertJsonPath('asset.title', 'AI home kit')
        ->assertJsonPath('asset.source', MediaAssetSource::Generated->value)
        ->assertJsonPath('storage', 'cloudinary');

    $asset = MediaAsset::query()->first();

    expect($asset)->not->toBeNull()
        ->and($asset->prompt)->toContain('Navy and gold')
        ->and($asset->cloudinary_public_id)->not->toBeNull()
        ->and($asset->path)->toStartWith('https://');
});

test('cloudinary upload stores remote meta when configured', function () {
    CloudinaryImageStorage::fake();

    $admin = createAdminUser();
    $admin->givePermissionTo(Permission::findOrCreate(AdminPermission::MediaManage->value, 'web'));

    $this->actingAs($admin)
        ->postJson(route('admin.api.media-assets.store'), [
            'title' => 'Cloud kit',
            'image' => UploadedFile::fake()->image('cloud.jpg'),
        ])
        ->assertCreated()
        ->assertJsonPath('storage', 'cloudinary')
        ->assertJsonPath('asset.source', MediaAssetSource::Upload->value);

    $asset = MediaAsset::query()->first();

    expect($asset->cloudinary_public_id)->not->toBeNull()
        ->and($asset->path)->toStartWith('https://');
});
