import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';

function ClubCrest({ club, className = '' }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });

    if (club?.logo_url) {
        return (
            <img
                src={club.logo_url}
                alt=""
                className={['mf-shop-crest__img', className].filter(Boolean).join(' ')}
                onError={(event) => onImageError(event, fallbackUrl)}
            />
        );
    }

    return (
        <span className={['mf-shop-crest__mark mf-display', className].filter(Boolean).join(' ')} aria-hidden>
            {(club?.short || club?.name || 'MF').slice(0, 3)}
        </span>
    );
}

function stockChipClass(purchasable) {
    return [
        'mf-ticket-chip',
        'mf-mono',
        purchasable ? 'mf-ticket-chip--owned' : 'mf-shop-chip--out',
    ]
        .filter(Boolean)
        .join(' ');
}

function JerseyCard({ jersey, index = 0, compact = false }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });
    const sizesPreview = (jersey.sizes_available || []).slice(0, compact ? 2 : 4);

    return (
        <Link
            href={`/social/shop/${jersey.slug}`}
            className={['mf-shop-card', compact ? 'mf-shop-card--compact' : ''].filter(Boolean).join(' ')}
            prefetch
            style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
        >
            <div className="mf-shop-card__media">
                {jersey.image_url ? (
                    <img
                        src={jersey.image_url}
                        alt=""
                        className="mf-shop-card__img"
                        loading="lazy"
                        onError={(event) => onImageError(event, fallbackUrl)}
                    />
                ) : (
                    <div className="mf-shop-card__placeholder">
                        <ClubCrest club={jersey.club} />
                    </div>
                )}
                <div className="mf-shop-card__badges">
                    {jersey.kit_kind ? (
                        <span className="mf-shop-card__kind mf-mono">{jersey.kit_kind}</span>
                    ) : null}
                    {!compact && jersey.gallery_count > 1 ? (
                        <span className="mf-shop-card__shots mf-mono">{jersey.gallery_count} shots</span>
                    ) : null}
                </div>
            </div>
            <div className="mf-shop-card__body">
                <div className="mf-shop-card__club">
                    <span className="mf-shop-card__crest" aria-hidden>
                        <ClubCrest club={jersey.club} />
                    </span>
                    <p className="mf-text-caption text-[var(--mf-muted)]">
                        {jersey.club?.name || 'Mad Fan kit'}
                    </p>
                </div>
                <h2 className="mf-shop-card__title mf-display">{jersey.name}</h2>
                {sizesPreview.length > 0 ? (
                    <p className="mf-shop-card__sizes mf-mono">
                        {sizesPreview.join(' · ')}
                        {(jersey.sizes_available || []).length > sizesPreview.length ? ' · …' : ''}
                    </p>
                ) : (
                    <p className="mf-shop-card__sizes mf-mono">No sizes left</p>
                )}
                <div className="mf-shop-card__meta">
                    <span className="mf-shop-card__price mf-mono">£{jersey.price}</span>
                    <span className={stockChipClass(jersey.purchasable)}>
                        {jersey.purchasable ? 'In stock' : 'Sold out'}
                    </span>
                </div>
            </div>
        </Link>
    );
}

function FeaturedCard({ jersey }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });

    return (
        <Link href={`/social/shop/${jersey.slug}`} className="mf-shop-featured-card" prefetch>
            <div className="mf-shop-featured-card__media">
                {jersey.image_url ? (
                    <img
                        src={jersey.image_url}
                        alt=""
                        className="mf-shop-featured-card__img"
                        loading="lazy"
                        onError={(event) => onImageError(event, fallbackUrl)}
                    />
                ) : (
                    <div className="mf-shop-featured-card__placeholder">
                        <ClubCrest club={jersey.club} />
                    </div>
                )}
                {jersey.kit_kind ? (
                    <span className="mf-shop-featured-card__kind mf-mono">{jersey.kit_kind}</span>
                ) : null}
            </div>
            <div className="mf-shop-featured-card__body">
                <p className="mf-text-caption text-[var(--mf-muted)]">
                    {jersey.club?.name || 'Mad Fan kit'}
                </p>
                <p className="mf-shop-featured-card__title mf-display">{jersey.name}</p>
                <p className="mf-shop-featured-card__price mf-mono">£{jersey.price}</p>
            </div>
        </Link>
    );
}

function FeaturedSwiper({ jerseys = [] }) {
    const loop = useMemo(() => {
        if (jerseys.length === 0) {
            return [];
        }

        const base = jerseys.length < 4 ? [...jerseys, ...jerseys] : jerseys;

        return [...base, ...base];
    }, [jerseys]);

    if (loop.length === 0) {
        return null;
    }

    return (
        <section className="mf-shop-featured" aria-label="Featured kits">
            <div className="mf-shop-featured__head">
                <p className="mf-tickets-kicker mf-text-caption">Fresh on the rail</p>
                <h2 className="mf-shop-featured__title mf-display">Featured drops</h2>
            </div>
            <div className="mf-shop-swiper">
                <div
                    className="mf-shop-swiper__track"
                    style={{ '--mf-shop-swiper-count': loop.length }}
                >
                    {loop.map((jersey, index) => (
                        <FeaturedCard key={`${jersey.id}-${index}`} jersey={jersey} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function BrowseChips({ label, children }) {
    return (
        <div className="mf-shop-browse">
            <p className="mf-shop-browse__label mf-text-caption text-[var(--mf-muted)]">{label}</p>
            <div className="mf-shop-browse__rail" role="list">
                {children}
            </div>
        </div>
    );
}

function BrowseChip({ active, onClick, children, ariaLabel }) {
    return (
        <button
            type="button"
            role="listitem"
            className={['mf-shop-browse__chip', active ? 'is-active' : ''].filter(Boolean).join(' ')}
            aria-pressed={active}
            aria-label={ariaLabel}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

function updateFilters(filters, patch) {
    const next = {
        club_id: filters.club_id || undefined,
        league_id: filters.league_id || undefined,
        category: filters.category || undefined,
        sort: filters.sort && filters.sort !== 'name' ? filters.sort : undefined,
        in_stock: filters.in_stock ? 1 : undefined,
        ...patch,
    };

    Object.keys(next).forEach((key) => {
        if (next[key] === undefined || next[key] === null || next[key] === '') {
            delete next[key];
        }
    });

    router.get('/social/shop', next, {
        preserveState: true,
        replace: true,
        preserveScroll: true,
    });
}

function toggleFilter(filters, key, value) {
    updateFilters(filters, {
        [key]: String(filters[key] ?? '') === String(value) ? undefined : value,
    });
}

function hasActiveFilters(filters) {
    return Boolean(
        filters.club_id ||
            filters.league_id ||
            filters.category ||
            filters.in_stock ||
            (filters.sort && filters.sort !== 'name'),
    );
}

export default function Index({
    jerseys = [],
    featured = [],
    clubs = [],
    leagues = [],
    categories = [],
    cart_count = 0,
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
    const selectedLeague = leagues.find((league) => String(league.id) === String(activeFilters.league_id));
    const selectedCategory = categories.find(
        (category) => category.slug === activeFilters.category,
    );

    return (
        <SocialShell title="Shop">
            <Head title="Jersey mall — Mad Fan Social" />

            <div className="mf-shop mf-shop--mall">
                <header className="mf-shop-mall-hero">
                    <div>
                        <p className="mf-tickets-kicker mf-text-caption">Mad Fan mall</p>
                        <h1 className="mf-empty-title mf-tickets-title">Jersey floor</h1>
                        <div className="mf-shop-hero-links">
                            <Link href="/social/shop/cart" className="mf-tickets-mine-link" prefetch>
                                Bag
                                {cart_count > 0 ? (
                                    <span className="mf-mono mf-tickets-count">{cart_count}</span>
                                ) : null}
                            </Link>
                            <Link href="/social/shop/orders" className="mf-tickets-mine-link" prefetch>
                                My orders
                            </Link>
                        </div>
                    </div>
                    <div className="mf-shop-mall-hero__rail" aria-hidden>
                        <span className="mf-shop-mall-hero__mark mf-display">KIT</span>
                        <span className="mf-shop-mall-hero__mark mf-display">ROOM</span>
                    </div>
                </header>

                <FeaturedSwiper jerseys={featured} />

                <div className="mf-shop-browse-stack">
                    {categories.length > 0 ? (
                        <BrowseChips label="By category">
                            <BrowseChip
                                active={!activeFilters.category}
                                onClick={() => updateFilters(activeFilters, { category: undefined })}
                                ariaLabel="All categories"
                            >
                                All kits
                            </BrowseChip>
                            {categories.map((category) => (
                                <BrowseChip
                                    key={category.slug}
                                    active={activeFilters.category === category.slug}
                                    onClick={() =>
                                        toggleFilter(activeFilters, 'category', category.slug)
                                    }
                                    ariaLabel={`${category.label}, ${category.count} kits`}
                                >
                                    {category.label}
                                    <span className="mf-shop-browse__count mf-mono">{category.count}</span>
                                </BrowseChip>
                            ))}
                        </BrowseChips>
                    ) : null}

                    {leagues.length > 0 ? (
                        <BrowseChips label="By league">
                            <BrowseChip
                                active={!activeFilters.league_id}
                                onClick={() => updateFilters(activeFilters, { league_id: undefined })}
                                ariaLabel="All leagues"
                            >
                                All leagues
                            </BrowseChip>
                            {leagues.map((league) => (
                                <BrowseChip
                                    key={league.id}
                                    active={String(activeFilters.league_id) === String(league.id)}
                                    onClick={() =>
                                        toggleFilter(activeFilters, 'league_id', league.id)
                                    }
                                    ariaLabel={league.name}
                                >
                                    <span className="mf-shop-browse__short mf-mono">{league.short}</span>
                                    <span className="mf-shop-browse__name">{league.name}</span>
                                </BrowseChip>
                            ))}
                        </BrowseChips>
                    ) : null}

                    {clubs.length > 0 ? (
                        <BrowseChips label="By club">
                            <BrowseChip
                                active={!activeFilters.club_id}
                                onClick={() => updateFilters(activeFilters, { club_id: undefined })}
                                ariaLabel="All clubs"
                            >
                                All clubs
                            </BrowseChip>
                            {favourite_club_id ? (
                                <BrowseChip
                                    active={String(activeFilters.club_id) === String(favourite_club_id)}
                                    onClick={() =>
                                        toggleFilter(activeFilters, 'club_id', favourite_club_id)
                                    }
                                    ariaLabel="My club"
                                >
                                    <span className="mf-shop-browse__crest">
                                        <ClubCrest
                                            club={clubs.find(
                                                (club) => String(club.id) === String(favourite_club_id),
                                            )}
                                        />
                                    </span>
                                    My club
                                </BrowseChip>
                            ) : null}
                            {clubs.map((club) => (
                                <BrowseChip
                                    key={club.id}
                                    active={String(activeFilters.club_id) === String(club.id)}
                                    onClick={() => toggleFilter(activeFilters, 'club_id', club.id)}
                                    ariaLabel={club.name}
                                >
                                    <span className="mf-shop-browse__crest">
                                        <ClubCrest club={club} />
                                    </span>
                                    <span className="mf-shop-browse__short mf-mono">{club.short}</span>
                                    <span className="mf-shop-browse__name">{club.name}</span>
                                </BrowseChip>
                            ))}
                        </BrowseChips>
                    ) : null}
                </div>

                <div className="mf-shop-toolbar" role="search" aria-label="Sort and stock filters">
                    <label className="mf-shop-filter">
                        <span className="mf-text-caption text-[var(--mf-muted)]">Sort</span>
                        <select
                            className="mf-shop-filter__control"
                            value={activeFilters.sort}
                            onChange={(e) =>
                                updateFilters(activeFilters, {
                                    sort: e.target.value === 'name' ? undefined : e.target.value,
                                })
                            }
                        >
                            <option value="name">Name</option>
                            <option value="price_asc">Price ↑</option>
                            <option value="price_desc">Price ↓</option>
                            <option value="newest">Newest</option>
                        </select>
                    </label>

                    <label className="mf-shop-filter mf-shop-filter--toggle">
                        <input
                            type="checkbox"
                            checked={activeFilters.in_stock}
                            onChange={(e) =>
                                updateFilters(activeFilters, {
                                    in_stock: e.target.checked ? 1 : undefined,
                                })
                            }
                        />
                        <span>In stock only</span>
                    </label>

                    <p className="mf-shop-toolbar__count mf-mono">
                        {jerseys.length} {jerseys.length === 1 ? 'kit' : 'kits'}
                        {selectedCategory ? ` · ${selectedCategory.label}` : ''}
                        {selectedLeague ? ` · ${selectedLeague.short || selectedLeague.name}` : ''}
                        {selectedClub ? ` · ${selectedClub.short || selectedClub.name}` : ''}
                    </p>
                </div>

                {jerseys.length === 0 ? (
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
                )}
            </div>
        </SocialShell>
    );
}
