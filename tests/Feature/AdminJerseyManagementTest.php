<?php

use App\Enums\AdminPermission;
use App\Enums\JerseyOrderStatus;
use App\Enums\JerseySize;
use App\Models\Club;
use App\Models\Jersey;
use App\Models\JerseyOrder;
use App\Models\JerseyVariant;
use Spatie\Permission\Models\Permission;

test('admins can manage jerseys via the admin api', function () {
    $admin = createAdminUser();
    $club = Club::factory()->create();

    $this->actingAs($admin)
        ->postJson(route('admin.api.jerseys.store'), [
            'club_id' => $club->id,
            'name' => 'Third Kit',
            'description' => 'Limited drop',
            'price' => '89.99',
            'is_active' => true,
            'variants' => [
                ['size' => JerseySize::M->value, 'stock' => 8, 'sku' => '3RD-M'],
                ['size' => JerseySize::L->value, 'stock' => 4, 'sku' => '3RD-L'],
            ],
        ])
        ->assertCreated()
        ->assertJsonPath('name', 'Third Kit');

    $jersey = Jersey::query()->where('name', 'Third Kit')->first();

    expect($jersey)->not->toBeNull()
        ->and($jersey->variants)->toHaveCount(2);

    $this->actingAs($admin)
        ->get(route('admin.jerseys'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Jerseys/Index')
            ->has('jerseys.data', 1));
});

test('admins can update jersey order status', function () {
    $admin = createAdminUser();
    $order = JerseyOrder::factory()->confirmed()->create([
        'total' => '69.99',
    ]);

    $this->actingAs($admin)
        ->putJson(route('admin.api.jersey-orders.update', $order), [
            'status' => JerseyOrderStatus::Fulfilled->value,
        ])
        ->assertSuccessful()
        ->assertJsonPath('status', JerseyOrderStatus::Fulfilled->value);

    expect($order->fresh()->status)->toBe(JerseyOrderStatus::Fulfilled)
        ->and($order->fresh()->fulfilled_at)->not->toBeNull();
});

test('support staff can view jersey orders but cannot manage listings', function () {
    $support = createSupportAdmin();
    Permission::findOrCreate(AdminPermission::JerseyOrdersView->value, 'web');
    $support->givePermissionTo(AdminPermission::JerseyOrdersView->value);

    JerseyOrder::factory()->confirmed()->create();

    $this->actingAs($support)
        ->get(route('admin.jersey-orders'))
        ->assertSuccessful();

    $this->actingAs($support)
        ->get(route('admin.jerseys'))
        ->assertForbidden();
});

test('stock is reduced when a variant is sold', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);
    $jersey = Jersey::factory()->create(['club_id' => $club->id, 'price' => '40.00']);
    $variant = JerseyVariant::factory()->size(JerseySize::S)->create([
        'jersey_id' => $jersey->id,
        'stock' => 3,
    ]);

    $this->actingAs($user)
        ->post(route('social.shop.cart.store'), [
            'variant_id' => $variant->id,
            'quantity' => 2,
        ]);

    $this->actingAs($user)
        ->post(route('social.shop.checkout.store'), [
            'shipping_name' => 'Fan',
            'shipping_line1' => '1 Road',
            'shipping_city' => 'City',
            'shipping_postcode' => 'AB1 2CD',
        ])
        ->assertRedirect();

    expect($variant->fresh()->stock)->toBe(1);
});
