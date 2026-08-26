<?php

use App\Enums\ProductOrderStatus;
use App\Models\Club;
use App\Models\Fandom;
use App\Models\League;
use App\Models\Product;
use App\Models\ProductOrder;
use App\Models\ProductVariant;
use App\Support\ApplicationSettings;

test('store requires authentication', function () {
    $this->get('/social/shop')->assertRedirect(route('login'));
});

test('store is blocked when the network setting is disabled', function () {
    ApplicationSettings::sync(['social_network_enabled' => 'false']);

    $user = createUser(['email_verified_at' => now()]);

    $this->actingAs($user)
        ->get('/social/shop')
        ->assertRedirect(route('fan.campaign'));
});

test('onboarded fans can browse active apparel products', function () {
    $club = Club::factory()->create(['name' => 'Terrace United']);
    $user = socialReadyUser($club);

    $product = Product::factory()->create([
        'club_id' => $club->id,
        'name' => 'Home Kit 25/26',
        'category' => 'kit',
        'price' => '69.99',
        'is_active' => true,
    ]);

    ProductVariant::factory()->label('M')->create([
        'product_id' => $product->id,
        'stock' => 12,
    ]);

    Product::factory()->inactive()->create([
        'club_id' => $club->id,
        'name' => 'Hidden Kit',
    ]);

    $this->actingAs($user)
        ->get(route('social.shop.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Shop/Index')
            ->has('products', 1)
            ->has('featured')
            ->has('categories')
            ->has('types')
            ->has('fandoms')
            ->has('leagues')
            ->where('products.0.name', 'Home Kit 25/26')
            ->where('products.0.price', '69.99')
            ->where('products.0.purchasable', true)
            ->where('products.0.product_type', 'apparel')
            ->where('products.0.options_available', ['M']));
});

test('the store lists collectibles and subscriptions alongside apparel', function () {
    $fandom = Fandom::factory()->create(['name' => 'Esports', 'slug' => 'esports']);
    $user = socialReadyUser();

    $collectible = Product::factory()->collectible()->create(['fandom_id' => $fandom->id, 'is_active' => true]);
    ProductVariant::factory()->label('Original')->create(['product_id' => $collectible->id, 'stock' => 1]);

    $subscription = Product::factory()->subscription()->create(['fandom_id' => $fandom->id, 'is_active' => true]);
    ProductVariant::factory()->unlimited()->label('1 Month')->create(['product_id' => $subscription->id]);

    $this->actingAs($user)
        ->get(route('social.shop.index', ['type' => 'collectible']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('products', 1)
            ->where('products.0.product_type', 'collectible'));

    $this->actingAs($user)
        ->get(route('social.shop.index', ['type' => 'subscription']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('products', 1)
            ->where('products.0.product_type', 'subscription')
            ->where('products.0.is_digital', true));

    $this->actingAs($user)
        ->get(route('social.shop.index', ['fandom_id' => $fandom->id]))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->has('products', 2));
});

test('fans can filter the store by category, league, and club', function () {
    $league = League::factory()->create(['name' => 'Premier League', 'short' => 'EPL']);
    $otherLeague = League::factory()->create(['name' => 'La Liga', 'short' => 'LLG']);

    $club = Club::factory()->create(['name' => 'North End', 'league_id' => $league->id]);
    $rival = Club::factory()->create(['name' => 'South City', 'league_id' => $otherLeague->id]);
    $user = socialReadyUser($club);

    $home = Product::factory()->create(['club_id' => $club->id, 'name' => 'North End Home 25/26', 'category' => 'kit', 'is_active' => true]);
    $away = Product::factory()->create(['club_id' => $club->id, 'name' => 'North End Boots', 'category' => 'boots', 'is_active' => true]);
    $rivalKit = Product::factory()->create(['club_id' => $rival->id, 'name' => 'South City Home 25/26', 'category' => 'kit', 'is_active' => true]);

    foreach ([$home, $away, $rivalKit] as $product) {
        ProductVariant::factory()->label('M')->create(['product_id' => $product->id, 'stock' => 5]);
    }

    $this->actingAs($user)
        ->get(route('social.shop.index', ['category' => 'kit']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('products', 2)
            ->where('filters.category', 'kit'));

    $this->actingAs($user)
        ->get(route('social.shop.index', ['league' => $league->id]))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('products', 2)
            ->where('filters.league_id', $league->id));

    $this->actingAs($user)
        ->get(route('social.shop.index', ['club' => $club->id]))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('products', 2)
            ->where('filters.club_id', $club->id));
});

test('fans can add a physical product to the bag and checkout requires shipping', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);

    $product = Product::factory()->create([
        'club_id' => $club->id,
        'name' => 'Away Stripe',
        'slug' => 'away-stripe',
        'price' => '74.99',
    ]);

    $variant = ProductVariant::factory()->label('L')->create([
        'product_id' => $product->id,
        'stock' => 5,
    ]);

    $this->actingAs($user)
        ->get(route('social.shop.show', $product))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Social/Shop/Show')
            ->where('product.slug', 'away-stripe')
            ->has('product.variants', 1));

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
            ->where('cart.total', '149.98')
            ->where('cart.requires_shipping', true));

    // Missing shipping on a bag with a physical item fails validation.
    $this->actingAs($user)
        ->from(route('social.shop.checkout'))
        ->post(route('social.shop.checkout.store'), [])
        ->assertRedirect(route('social.shop.checkout'))
        ->assertSessionHasErrors('shipping_name');

    $this->actingAs($user)
        ->post(route('social.shop.checkout.store'), [
            'shipping_name' => 'Fan Tester',
            'shipping_line1' => '12 North Stand',
            'shipping_city' => 'Liverpool',
            'shipping_postcode' => 'L4 0TH',
            'shipping_country' => 'GB',
        ])
        ->assertRedirect();

    $order = ProductOrder::query()->where('user_id', $user->id)->first();

    expect($order)->not->toBeNull()
        ->and($order->status)->toBe(ProductOrderStatus::Confirmed)
        ->and((string) $order->total)->toBe('149.98')
        ->and($order->requires_shipping)->toBeTrue()
        ->and($order->code)->toStartWith('MF')
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

test('a bag of only digital goods checks out without any shipping details', function () {
    $user = socialReadyUser();

    $product = Product::factory()->subscription()->create(['name' => 'Netflix Gift Subscription', 'price' => '9.99']);
    $variant = ProductVariant::factory()->unlimited()->label('1 Month')->create(['product_id' => $product->id]);

    $this->actingAs($user)
        ->post(route('social.shop.cart.store'), ['variant_id' => $variant->id, 'quantity' => 1])
        ->assertRedirect();

    $this->actingAs($user)
        ->get(route('social.shop.cart'))
        ->assertInertia(fn ($page) => $page->where('cart.requires_shipping', false));

    $this->actingAs($user)
        ->post(route('social.shop.checkout.store'), [])
        ->assertRedirect();

    $order = ProductOrder::query()->where('user_id', $user->id)->first();

    expect($order)->not->toBeNull()
        ->and($order->requires_shipping)->toBeFalse()
        ->and($order->shipping_name)->toBeNull();
});

test('checkout fails when stock is insufficient', function () {
    $club = Club::factory()->create();
    $user = socialReadyUser($club);

    $product = Product::factory()->create(['club_id' => $club->id, 'price' => '50.00']);
    $variant = ProductVariant::factory()->label('M')->create([
        'product_id' => $product->id,
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

    expect(ProductOrder::query()->count())->toBe(0);
});

test('fans can only view their own product orders', function () {
    $owner = socialReadyUser(Club::factory()->create());
    $stranger = socialReadyUser(Club::factory()->create());

    $order = ProductOrder::factory()->confirmed()->create([
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
