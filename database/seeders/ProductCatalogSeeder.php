<?php

namespace Database\Seeders;

use App\Models\Fandom;
use App\Models\Jersey;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Idempotent catalog for the general Mad Fan store: every active Jersey row
 * is mirrored into a Product (apparel/kit) so the storefront has real data
 * on day one without touching the legacy Jersey tables (admin jersey
 * management and historic JerseyOrder rows are untouched by this), plus
 * brand-name gear, NFT collectibles, and subscription/credit products that
 * have nothing to do with football at all.
 *
 * Run alone after ProductCatalogSeeder's dependencies exist:
 *   php artisan db:seed --class=ProductCatalogSeeder
 */
class ProductCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $football = Fandom::query()->where('slug', 'football')->first();
        $esports = Fandom::query()->where('slug', 'esports')->first();
        $music = Fandom::query()->where('slug', 'music')->first();

        $this->migrateJerseys($football);
        $this->seedBrandGear($football);
        $this->seedCollectibles($football, $esports);
        $this->seedSubscriptions($esports, $music);

        $this->command?->info(sprintf('Product catalog ready: %d products.', Product::query()->count()));
    }

    private function migrateJerseys(?Fandom $football): void
    {
        Jersey::query()->active()->with('variants')->each(function (Jersey $jersey) use ($football): void {
            $product = Product::query()->updateOrCreate(
                ['slug' => $jersey->slug],
                [
                    'fandom_id' => $football?->id,
                    'club_id' => $jersey->club_id,
                    'product_type' => 'apparel',
                    'category' => $this->detectKitCategory($jersey->name),
                    'name' => $jersey->name,
                    'description' => $jersey->description,
                    'image' => $jersey->image,
                    'price' => $jersey->price,
                    'currency' => 'GBP',
                    'is_digital' => false,
                    'is_active' => true,
                    'is_featured' => false,
                ],
            );

            foreach ($jersey->variants as $variant) {
                ProductVariant::query()->updateOrCreate(
                    ['product_id' => $product->id, 'label' => $variant->size->value],
                    ['stock' => $variant->stock, 'sku' => $variant->sku],
                );
            }
        });
    }

    private function detectKitCategory(string $name): string
    {
        return preg_match('/\bTraining\b/i', $name) === 1 ? 'training' : 'kit';
    }

    private function seedBrandGear(?Fandom $football): void
    {
        $items = [
            ['brand' => 'Nike', 'name' => 'Nike Mercurial Vapor Boots', 'category' => 'boots', 'price' => '219.99', 'sizes' => ['UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11']],
            ['brand' => 'Adidas', 'name' => 'Adidas Predator Elite Boots', 'category' => 'boots', 'price' => '229.99', 'sizes' => ['UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11']],
            ['brand' => 'Puma', 'name' => 'Puma Ultra Ultimate Boots', 'category' => 'boots', 'price' => '199.99', 'sizes' => ['UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11']],
            ['brand' => 'Nike', 'name' => 'Nike Matchday Crew Socks', 'category' => 'socks', 'price' => '14.99', 'sizes' => ['S', 'M', 'L']],
            ['brand' => 'Adidas', 'name' => 'Adidas Grip Socks', 'category' => 'socks', 'price' => '12.99', 'sizes' => ['S', 'M', 'L']],
            ['brand' => 'Mad Fan', 'name' => 'Mad Fan Terrace Cap', 'category' => 'caps', 'price' => '19.99', 'sizes' => ['One size']],
            ['brand' => 'New Era', 'name' => 'New Era Matchday Snapback', 'category' => 'caps', 'price' => '24.99', 'sizes' => ['One size']],
        ];

        foreach ($items as $item) {
            $product = Product::query()->updateOrCreate(
                ['slug' => Str::slug($item['brand'].' '.$item['name'])],
                [
                    'fandom_id' => $football?->id,
                    'club_id' => null,
                    'product_type' => 'apparel',
                    'category' => $item['category'],
                    'name' => $item['name'],
                    'description' => "Official {$item['brand']} gear for matchday.",
                    'brand' => $item['brand'],
                    'price' => $item['price'],
                    'currency' => 'GBP',
                    'is_digital' => false,
                    'is_active' => true,
                    'is_featured' => true,
                ],
            );

            foreach ($item['sizes'] as $size) {
                ProductVariant::query()->updateOrCreate(
                    ['product_id' => $product->id, 'label' => $size],
                    ['stock' => random_int(6, 30), 'sku' => Str::upper(Str::slug($item['brand'].'-'.$size, '-'))],
                );
            }
        }
    }

    private function seedCollectibles(?Fandom $football, ?Fandom $esports): void
    {
        $items = [
            ['fandom' => $football, 'name' => 'Golden Boot Legends Card #007', 'rarity' => 'Legendary', 'edition' => '1 of 50', 'price' => '149.99'],
            ['fandom' => $football, 'name' => 'Terrace United Icon Card', 'rarity' => 'Rare', 'edition' => '1 of 250', 'price' => '49.99'],
            ['fandom' => $esports, 'name' => 'VALORANT Champions Moment Card', 'rarity' => 'Epic', 'edition' => '1 of 500', 'price' => '34.99'],
            ['fandom' => $esports, 'name' => 'League of Legends Worlds MVP Card', 'rarity' => 'Legendary', 'edition' => '1 of 100', 'price' => '99.99'],
        ];

        foreach ($items as $item) {
            $product = Product::query()->updateOrCreate(
                ['slug' => Str::slug($item['name'])],
                [
                    'fandom_id' => $item['fandom']?->id,
                    'club_id' => null,
                    'product_type' => 'collectible',
                    'category' => 'nft',
                    'name' => $item['name'],
                    'description' => 'Digital collectible card — ownership recorded to your Mad Fan wallet on purchase.',
                    'price' => $item['price'],
                    'currency' => 'GBP',
                    'is_digital' => true,
                    'is_active' => true,
                    'is_featured' => $item['rarity'] === 'Legendary',
                    'attributes' => ['edition' => $item['edition'], 'rarity' => $item['rarity']],
                ],
            );

            ProductVariant::query()->updateOrCreate(
                ['product_id' => $product->id, 'label' => 'Original'],
                ['stock' => (int) Str::of($item['edition'])->after('of ')->trim()->toString(), 'sku' => 'NFT-'.$product->id],
            );
        }
    }

    private function seedSubscriptions(?Fandom $esports, ?Fandom $music): void
    {
        $items = [
            ['fandom' => null, 'brand' => 'Netflix', 'name' => 'Netflix Gift Subscription', 'category' => 'streaming', 'tiers' => [['1 Month', '9.99'], ['3 Months', '27.99'], ['12 Months', '99.99']]],
            ['fandom' => $music, 'brand' => 'Spotify', 'name' => 'Spotify Premium Gift Card', 'category' => 'music', 'tiers' => [['1 Month', '10.99'], ['3 Months', '29.99'], ['12 Months', '109.99']]],
            ['fandom' => $esports, 'brand' => 'Call of Duty', 'name' => 'Call of Duty Points', 'category' => 'gaming', 'tiers' => [['500 CP', '3.99'], ['1100 CP', '7.99'], ['2400 CP', '15.99'], ['5000 CP', '31.99']]],
            ['fandom' => $esports, 'brand' => 'Xbox', 'name' => 'Xbox Game Pass Ultimate', 'category' => 'gaming', 'tiers' => [['1 Month', '12.99'], ['3 Months', '34.99']]],
        ];

        foreach ($items as $item) {
            $product = Product::query()->updateOrCreate(
                ['slug' => Str::slug($item['brand'].' '.$item['name'])],
                [
                    'fandom_id' => $item['fandom']?->id,
                    'club_id' => null,
                    'product_type' => 'subscription',
                    'category' => $item['category'],
                    'name' => $item['name'],
                    'description' => "Redeem code emailed instantly after purchase — {$item['brand']} handles delivery from there.",
                    'brand' => $item['brand'],
                    'price' => $item['tiers'][0][1],
                    'currency' => 'GBP',
                    'is_digital' => true,
                    'is_active' => true,
                    'is_featured' => false,
                    'attributes' => ['delivery' => 'Redemption code emailed after purchase'],
                ],
            );

            foreach ($item['tiers'] as [$label, $price]) {
                ProductVariant::query()->updateOrCreate(
                    ['product_id' => $product->id, 'label' => $label],
                    ['stock' => null, 'sku' => null, 'price_override' => $price],
                );
            }
        }
    }
}
