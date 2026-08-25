import { Head, router } from '@inertiajs/react';
import { useMemo } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import SplitView from '../components/SplitView';
import HeroCarousel from './HeroCarousel';
import FeaturedSwiper from './FeaturedSwiper';
import ShopFilters from './ShopFilters';
import JerseyCard from './JerseyCard';
import { hasActiveFilters } from './filters';

export default function Index({
    jerseys = [],
    featured = [],
    clubs = [],
    leagues = [],
    categories = [],
    filters = {},
    favourite_club_id = null,
}) {
    const activeFilters = {
        club_id: filters.club_id ?? '',
        league_id: filters.league_id ?? '',
        category: filters.category ?? '',
        sort: filters.sort ?? 'name',
        in_stock: Boolean(filters.in_stock),
    };
    const filtersOn = hasActiveFilters(activeFilters);
    const selectedClub = clubs.find((club) => String(club.id) === String(activeFilters.club_id));
    const selectedLeague = leagues.find(
        (league) => String(league.id) === String(activeFilters.league_id),
    );
    const selectedCategory = categories.find(
        (category) => category.slug === activeFilters.category,
    );

    const heroKits = useMemo(() => {
        const fromFeatured = featured.slice(0, 4);

        if (fromFeatured.length >= 4 || jerseys.length === 0) {
            return fromFeatured;
        }

        const seen = new Set(fromFeatured.map((jersey) => jersey.id));
        const extras = jerseys
            .filter((jersey) => jersey.purchasable && !seen.has(jersey.id))
            .slice(0, 4 - fromFeatured.length);

        return [...fromFeatured, ...extras];
    }, [featured, jerseys]);

    return (
        <SocialShell title="Store" wide>
            <Head title="Jersey mall — Mad Fan Social" />

            <div className="mf-shop mf-shop--mall">
                <header className="mf-shop-mall-hero">
                    <div className="mf-shop-mall-hero__bg" aria-hidden />
                    <div className="mf-shop-mall-hero__scrim" aria-hidden />
                    <div className="mf-shop-mall-hero__inner">
                        <HeroCarousel jerseys={heroKits} />
                    </div>
                </header>

                <FeaturedSwiper jerseys={featured} />

                <SplitView
                    mode="rail"
                    railLabel="Filters"
                    contentLabel="Kits"
                    rail={
                        <ShopFilters
                            activeFilters={activeFilters}
                            categories={categories}
                            leagues={leagues}
                            clubs={clubs}
                            favourite_club_id={favourite_club_id}
                            jerseys={jerseys}
                            selectedCategory={selectedCategory}
                            selectedLeague={selectedLeague}
                            selectedClub={selectedClub}
                        />
                    }
                    content={
                        jerseys.length === 0 ? (
                            <div className="mf-empty mf-empty--compact mf-shop-empty">
                                <p className="mf-empty-title">No kits on this rail</p>
                                <p className="mf-empty-copy">
                                    {filtersOn
                                        ? 'Nothing matches these filters — clear them or pick another aisle.'
                                        : 'The jersey floor is empty right now. Check back after the next drop.'}
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
                                {jerseys.map((jersey, index) => (
                                    <JerseyCard key={jersey.id} jersey={jersey} index={index} compact />
                                ))}
                            </div>
                        )
                    }
                />
            </div>
        </SocialShell>
    );
}
