import { Head, router } from '@inertiajs/react';
import { useMemo } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import SplitView from '../components/SplitView';
import HeroCarousel from './HeroCarousel';
import FeaturedSwiper from './FeaturedSwiper';
import ShopFilters from './ShopFilters';
import ProductCard from './ProductCard';
import { hasActiveFilters } from './filters';

export default function Index({
    products = [],
    featured = [],
    types = [],
    fandoms = [],
    clubs = [],
    leagues = [],
    categories = [],
    filters = {},
    favourite_club_id = null,
}) {
    const activeFilters = {
        type: filters.type ?? '',
        fandom_id: filters.fandom_id ?? '',
        club_id: filters.club_id ?? '',
        league_id: filters.league_id ?? '',
        category: filters.category ?? '',
        sort: filters.sort ?? 'name',
        in_stock: Boolean(filters.in_stock),
    };
    const filtersOn = hasActiveFilters(activeFilters);
    const selectedType = types.find((type) => type.value === activeFilters.type);
    const selectedFandom = fandoms.find((fandom) => String(fandom.id) === String(activeFilters.fandom_id));
    const selectedClub = clubs.find((club) => String(club.id) === String(activeFilters.club_id));
    const selectedLeague = leagues.find(
        (league) => String(league.id) === String(activeFilters.league_id),
    );
    const selectedCategory = categories.find(
        (category) => category.slug === activeFilters.category,
    );

    const heroProducts = useMemo(() => {
        const fromFeatured = featured.slice(0, 4);

        if (fromFeatured.length >= 4 || products.length === 0) {
            return fromFeatured;
        }

        const seen = new Set(fromFeatured.map((product) => product.id));
        const extras = products
            .filter((product) => product.purchasable && !seen.has(product.id))
            .slice(0, 4 - fromFeatured.length);

        return [...fromFeatured, ...extras];
    }, [featured, products]);

    return (
        <SocialShell title="Store" wide>
            <Head title="The Mad Fan Store" />

            <div className="mf-shop mf-shop--mall">
                <header className="mf-shop-mall-hero">
                    <div className="mf-shop-mall-hero__bg" aria-hidden />
                    <div className="mf-shop-mall-hero__scrim" aria-hidden />
                    <div className="mf-shop-mall-hero__inner">
                        <HeroCarousel products={heroProducts} />
                    </div>
                </header>

                <FeaturedSwiper products={featured} />

                <SplitView
                    mode="rail"
                    railLabel="Filters"
                    contentLabel="Store"
                    rail={
                        <ShopFilters
                            activeFilters={activeFilters}
                            types={types}
                            fandoms={fandoms}
                            categories={categories}
                            leagues={leagues}
                            clubs={clubs}
                            favourite_club_id={favourite_club_id}
                            products={products}
                            selectedType={selectedType}
                            selectedFandom={selectedFandom}
                            selectedCategory={selectedCategory}
                            selectedLeague={selectedLeague}
                            selectedClub={selectedClub}
                        />
                    }
                    content={
                        products.length === 0 ? (
                            <div className="mf-empty mf-empty--compact mf-shop-empty">
                                <p className="mf-empty-title">Nothing on this shelf</p>
                                <p className="mf-empty-copy">
                                    {filtersOn
                                        ? 'Nothing matches these filters — clear them or browse another aisle.'
                                        : 'The store is empty right now. Check back after the next drop.'}
                                </p>
                                {filtersOn ? (
                                    <button
                                        type="button"
                                        className="mf-btn mf-btn--ghost"
                                        onClick={() => router.get('/social/shop', {}, { replace: true })}
                                    >
                                        Clear filters
                                    </button>
                                ) : null}
                            </div>
                        ) : (
                            <div className="mf-shop-grid mf-shop-grid--mall">
                                {products.map((product, index) => (
                                    <ProductCard key={product.id} product={product} index={index} compact />
                                ))}
                            </div>
                        )
                    }
                />
            </div>
        </SocialShell>
    );
}
