<?php

use App\Enums\JerseyOrderStatus;
use App\Enums\JerseySize;
use App\Models\Club;
use App\Models\Jersey;
use App\Models\JerseyOrder;
use App\Models\JerseyVariant;
use App\Support\ApplicationSettings;

test('jersey shop requires authentication', function () {
    $this->get('/social/shop')->assertRedirect(route('login'));
});

test('jersey shop is blocked when the network setting is disabled', function () {
    ApplicationSettings::sync(['social_network_enabled' => 'false']);

    $user = createUser(['email_verified_at' => now()]);

    $this->actingAs($user)
        ->get('/social/shop')
        ->assertRedirect(route('fan.campaign'));
});

test('onboarded fans can browse active jerseys', function () {
    $club = Club::factory()->create(['name' => 'Terrace United']);
    $user = socialReadyUser($club);

    $jersey = Jersey::factory()->create([
        'club_id' => $club->id,
        'name' => 'Home Kit 25/26',
        'price' => '69.99',
        'is_active' => true,
    ]);

    JerseyVariant::factory()->size(JerseySize::M)->create([
        'jersey_id' => $jersey->id,
        'stock' => 12,
    ]);

    Jersey::factory()->inactive()->create([
        'club_id' => $club->id,
        'name' => 'Hidden Away',
    ]);

    $this->actingAs($user)
        ->get(route('social.shop.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Shop/Index')
            ->has('jerseys', 1)
            ->where('jerseys.0.name', 'Home Kit 25/26')
            ->where('jerseys.0.price', '69.99')
            ->where('jerseys.0.purchasable', true)
            ->where('jerseys.0.kit_kind', 'Home')
            ->where('jerseys.0.sizes_available', ['M']));
});

test('fans can add a jersey to the bag and confirm an order', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);

    $jersey = Jersey::factory()->create([
        'club_id' => $club->id,
        'name' => 'Away Stripe',
        'slug' => 'away-stripe',
        'price' => '74.99',
    ]);

    $variant = JerseyVariant::factory()->size(JerseySize::L)->create([
        'jersey_id' => $jersey->id,
        'stock' => 5,
    ]);

    $this->actingAs($user)
        ->get(route('social.shop.show', $jersey))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Shop/Show')
            ->where('jersey.slug', 'away-stripe')
            ->has('jersey.variants', 1));

    $this->actingAs($user)
        ->post(route('social.shop.cart.store'), [
            'variant_id' => $variant->id,
            'quantity' => 2,
        ])
        ->assertRedirect();

    $this->actingAs($user)
        ->get(route('social.shop.cart'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Shop/Cart')
            ->where('cart.count', 2)
            ->where('cart.total', '149.98'));

    $this->actingAs($user)
        ->post(route('social.shop.checkout.store'), [
            'shipping_name' => 'Fan Tester',
            'shipping_line1' => '12 North Stand',
            'shipping_city' => 'Liverpool',
            'shipping_postcode' => 'L4 0TH',
            'shipping_country' => 'GB',
        ])
        ->assertRedirect();

    $order = JerseyOrder::query()->where('user_id', $user->id)->first();

    expect($order)->not->toBeNull()
        ->and($order->status)->toBe(JerseyOrderStatus::Confirmed)
        ->and((string) $order->total)->toBe('149.98')
        ->and($order->code)->toStartWith('JY')
        ->and($order->items)->toHaveCount(1);

    expect($variant->fresh()->stock)->toBe(3);

    $this->actingAs($user)
        ->get(route('social.shop.orders.show', $order))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Shop/OrderShow')
            ->where('order.code', $order->code)
            ->where('order.shipping.postcode', 'L4 0TH'));
});

test('checkout fails when stock is insufficient', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);

    $jersey = Jersey::factory()->create(['club_id' => $club->id, 'price' => '50.00']);
    $variant = JerseyVariant::factory()->size(JerseySize::M)->create([
        'jersey_id' => $jersey->id,
        'stock' => 1,
    ]);

    $this->actingAs($user)
        ->post(route('social.shop.cart.store'), [
            'variant_id' => $variant->id,
            'quantity' => 1,
        ])
        ->assertRedirect();

    $variant->update(['stock' => 0]);

    $this->actingAs($user)
        ->from(route('social.shop.checkout'))
        ->post(route('social.shop.checkout.store'), [
            'shipping_name' => 'Fan Tester',
            'shipping_line1' => '1 Test Road',
            'shipping_city' => 'London',
            'shipping_postcode' => 'E1 1AA',
        ])
        ->assertRedirect(route('social.shop.checkout'))
        ->assertSessionHasErrors('cart');

    expect(JerseyOrder::query()->count())->toBe(0);
});

test('fans can only view their own jersey orders', function () {
    $owner = socialReadyUser(Club::factory()->create());
    $stranger = socialReadyUser(Club::factory()->create());

    $order = JerseyOrder::factory()->confirmed()->create([
        'user_id' => $owner->id,
        'total' => '69.99',
    ]);

    $this->actingAs($stranger)
        ->get(route('social.shop.orders.show', $order))
        ->assertForbidden();

    $this->actingAs($owner)
        ->get(route('social.shop.orders.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Shop/Orders')
            ->has('orders', 1)
            ->where('orders.0.id', $order->id));
});
